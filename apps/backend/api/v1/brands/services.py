"""
Brand resolution, owner links, and admin aggregates.
"""
import uuid

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct

from .models import Brand, OwnerBrand


def normalize_brand_name(name: str) -> str:
    return (name or "").strip().lower()


def search_brands(search: str | None, limit: int = 20):
    qs = Brand.objects.all()
    if search and search.strip():
        term = search.strip()
        qs = qs.filter(Q(name__icontains=term) | Q(normalized_name__icontains=term.lower()))
    return list(qs.order_by("name")[:limit])


def list_owner_brands(owner_id: str):
    ids = OwnerBrand.objects.filter(owner_id=owner_id).values_list("brand_id", flat=True)
    return list(Brand.objects.filter(id__in=ids).order_by("name"))


def resolve_or_create_brand(name: str) -> Brand:
    trimmed = (name or "").strip()
    if not trimmed:
        raise ValueError("Brand name is required")
    norm = normalize_brand_name(trimmed)
    existing = Brand.objects.filter(normalized_name=norm).first()
    if existing:
        return existing
    now = timezone.now()
    b = Brand(
        id=str(uuid.uuid4()),
        name=trimmed,
        normalized_name=norm,
        created_at=now,
        updated_at=now,
    )
    b.save()
    return b


def link_owner_brand(owner_id: str, brand_id: str) -> OwnerBrand:
    now = timezone.now()
    ob, _created = OwnerBrand.objects.get_or_create(
        owner_id=owner_id,
        brand_id=brand_id,
        defaults={
            "id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
        },
    )
    if not _created:
        OwnerBrand.objects.filter(pk=ob.pk).update(updated_at=now)
    return ob


def resolve_or_create_and_link(owner_id: str, name: str) -> Brand:
    brand = resolve_or_create_brand(name)
    link_owner_brand(owner_id, brand.id)
    return brand


def count_brand_usage_for_owner(owner_id: str, brand_id: str) -> int:
    pharm_ids = Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True)
    return MedicalProduct.objects.filter(pharmacy_id__in=pharm_ids, brand_id=brand_id).count()


def unlink_owner_brand(owner_id: str, brand_id: str) -> None:
    if count_brand_usage_for_owner(owner_id, brand_id) > 0:
        raise ValueError("Cannot unlink: products still use this brand")
    deleted, _ = OwnerBrand.objects.filter(owner_id=owner_id, brand_id=brand_id).delete()
    if deleted == 0:
        raise ValueError("Brand is not linked to this owner")


def owner_update_brand(owner_id: str, old_brand_id: str, new_name: str) -> Brand:
    trimmed = (new_name or "").strip()
    if not trimmed:
        raise ValueError("Brand name is required")
    norm = normalize_brand_name(trimmed)
    old = Brand.objects.filter(pk=old_brand_id).first()
    if not old:
        raise ValueError("Brand not found")
    if not OwnerBrand.objects.filter(owner_id=owner_id, brand_id=old_brand_id).exists():
        raise ValueError("Brand is not linked to this owner")

    now = timezone.now()
    pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))

    target = Brand.objects.filter(normalized_name=norm).first()
    if target is None:
        target = Brand(
            id=str(uuid.uuid4()),
            name=trimmed,
            normalized_name=norm,
            created_at=now,
            updated_at=now,
        )
        target.save()

    if target.id != old.id:
        MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids, brand_id=old.id).update(
            brand_id=target.id,
            brand_name=target.name,
            updated_at=now,
        )
        OwnerBrand.objects.filter(owner_id=owner_id, brand_id=old.id).delete()
        link_owner_brand(owner_id, target.id)
    else:
        if target.name != trimmed:
            Brand.objects.filter(pk=target.id).update(name=trimmed, updated_at=now)

    return Brand.objects.get(pk=target.id)


def list_brands_admin():
    """All brands with usage counts (two aggregate queries + merge)."""
    brands = list(Brand.objects.all().order_by("name"))
    owner_qs = (
        OwnerBrand.objects.values("brand_id")
        .annotate(owner_count=Count("id", distinct=True))
        .values_list("brand_id", "owner_count")
    )
    owner_map = dict(owner_qs)
    product_qs = (
        MedicalProduct.objects.exclude(brand_id__isnull=True)
        .values("brand_id")
        .annotate(product_count=Count("id", distinct=True))
        .values_list("brand_id", "product_count")
    )
    product_map = dict(product_qs)
    out = []
    for b in brands:
        out.append(
            {
                "brand": b,
                "owner_count": owner_map.get(b.id, 0),
                "product_count": product_map.get(b.id, 0),
            }
        )
    return out


def admin_delete_brand_safe(brand_id: str) -> None:
    oc = OwnerBrand.objects.filter(brand_id=brand_id).count()
    pc = MedicalProduct.objects.filter(brand_id=brand_id).count()
    if oc > 0 or pc > 0:
        raise ValueError("Brand is still in use")
    deleted, _ = Brand.objects.filter(pk=brand_id).delete()
    if deleted == 0:
        raise ValueError("Brand not found")
