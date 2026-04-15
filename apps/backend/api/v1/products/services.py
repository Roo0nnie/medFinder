"""
Product business logic and read-only operations.
"""
import uuid
from typing import Iterable, Optional

import mimetypes
import os
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from collections import defaultdict
from django.db.models import Case, IntegerField, Max, Q, QuerySet, Value, When
from django.utils import timezone

from api.v1.brands.models import Brand, OwnerBrand
from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy

from .models import MedicalProduct, MedicalProductVariant, ProductCategory, ProductSearch

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024


def resolve_brand_for_product_create(
    owner_id: str,
    brand_id: Optional[str],
    brand_name: Optional[str],
) -> tuple[Optional[str], str]:
    """Validate brandId against owner_brands when set; otherwise legacy brand_name only."""
    if brand_id:
        bid = str(brand_id).strip()
        if not bid:
            return None, (brand_name or "").strip()
        if not OwnerBrand.objects.filter(owner_id=owner_id, brand_id=bid).exists():
            raise ValueError("brandId is not linked to this owner")
        b = Brand.objects.get(pk=bid)
        return b.id, b.name
    return None, (brand_name or "").strip()


def resolve_brand_for_product_update(
    owner_id: str,
    raw: dict,
) -> Optional[tuple[Optional[str], str]]:
    """
    If neither brandId nor brandName is in the payload, return None (no change).
    Otherwise return (brand_id, brand_name) for the product row.
    """
    has_bid = "brandId" in raw or "brand_id" in raw
    has_bn = "brandName" in raw
    if not has_bid and not has_bn:
        return None
    brand_id = raw.get("brandId") or raw.get("brand_id")
    brand_name = raw.get("brandName")
    if brand_id:
        bid = str(brand_id).strip()
        if not OwnerBrand.objects.filter(owner_id=owner_id, brand_id=bid).exists():
            raise ValueError("brandId is not linked to this owner")
        b = Brand.objects.get(pk=bid)
        return b.id, b.name
    if has_bid:
        return None, (brand_name or "").strip()
    return None, (brand_name or "").strip()


def _build_prefix_raw_query(query: str) -> str:
    """
    Build a tsquery string with prefix matching (term:*).
    Only keeps alphanumeric tokens to avoid tsquery syntax issues/injection.
    """
    tokens = []
    for part in query.split():
        token = "".join(ch for ch in part if ch.isalnum())
        if token:
            tokens.append(f"{token}:*")
    return " & ".join(tokens)


def list_products(
    *,
    query: Optional[str] = None,
    category_id: Optional[str] = None,
    requires_prescription: Optional[bool] = None,
    manufacturer: Optional[str] = None,
    pharmacy_ids: Optional[list[str]] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    prefix: bool = False,
    search_type: str = "plain",
) -> QuerySet[MedicalProduct]:
    qs = MedicalProduct.objects.all()

    if pharmacy_ids is not None:
        qs = qs.filter(pharmacy_id__in=pharmacy_ids)

    if category_id:
        qs = qs.filter(category_id=category_id)

    if requires_prescription is not None:
        qs = qs.filter(requires_prescription=requires_prescription)

    if manufacturer:
        qs = qs.filter(manufacturer__icontains=manufacturer)

    if query:
        query = query.strip()
        if query:
            if prefix:
                raw = _build_prefix_raw_query(query)
                search_query = SearchQuery(raw, search_type="raw", config="english") if raw else None
            else:
                search_query = SearchQuery(query, search_type=search_type, config="english")

            vector = (
                SearchVector("name", weight="A", config="english")
                + SearchVector("generic_name", weight="A", config="english")
                + SearchVector("brand_name", weight="B", config="english")
                + SearchVector("search_synonyms", weight="B", config="english")
                + SearchVector("indications", weight="C", config="english")
                + SearchVector("active_ingredients", weight="C", config="english")
                + SearchVector("manufacturer", weight="D", config="english")
                + SearchVector("description", weight="D", config="english")
            )

            variant_match_product_ids = MedicalProductVariant.objects.filter(
                Q(label__icontains=query)
                | Q(unit__icontains=query)
                | Q(strength__icontains=query)
                | Q(dosage_form__icontains=query)
            ).values("product_id")

            # Hybrid recovery for short/infix terms (e.g., "flu", "gesic").
            token_count = len([part for part in query.split() if part])
            fallback_enabled = token_count == 1 and 2 <= len(query) <= 6
            product_text_fallback_filter = (
                Q(name__icontains=query)
                | Q(brand_name__icontains=query)
                | Q(generic_name__icontains=query)
                | Q(search_synonyms__icontains=query)
                | Q(indications__icontains=query)
                | Q(active_ingredients__icontains=query)
            )
            fallback_filter = Q(id__in=variant_match_product_ids)
            if fallback_enabled:
                fallback_filter = fallback_filter | product_text_fallback_filter

            if search_query is not None:
                qs = (
                    qs.annotate(rank=SearchRank(vector, search_query))
                    .filter(Q(rank__gt=0) | fallback_filter)
                    .annotate(
                        search_bucket=Case(
                            When(rank__gt=0, then=Value(0)),
                            default=Value(1),
                            output_field=IntegerField(),
                        )
                    )
                    .distinct()
                    .order_by("search_bucket", "-rank", "name")
                )
            else:
                qs = qs.filter(fallback_filter).distinct().order_by("name")
        else:
            qs = qs.order_by("name")
    else:
        qs = qs.order_by("name")

    if offset is not None:
        qs = qs[offset:]
    if limit is not None:
        qs = qs[:limit]

    return qs


def get_product_by_id(product_id: str) -> MedicalProduct:
    return MedicalProduct.objects.get(pk=product_id)


def _product_group_queryset(product: MedicalProduct) -> QuerySet[MedicalProduct]:
    """Products sharing the same medicine: generic_name (case-insensitive), or name when generic is empty."""
    gn = (product.generic_name or "").strip()
    if gn:
        return MedicalProduct.objects.filter(generic_name__iexact=gn)
    nm = (product.name or "").strip()
    return MedicalProduct.objects.filter(name__iexact=nm)


def list_brands_for_product_group(
    product: MedicalProduct,
    *,
    pharmacy_ids: Optional[list[str]] = None,
    variant_id: Optional[str] = None,
) -> list[dict]:
    """
    Distinct brands in the same generic/name group with at least one in-stock, available
    inventory row in an allowed pharmacy. pharmacy_ids=None means no pharmacy filter.
    When variant_id is set, only inventory rows for that variant are considered.
    """
    group_qs = _product_group_queryset(product)
    products = list(group_qs.only("id", "brand_id", "brand_name", "name"))
    if not products:
        return []

    product_ids = [p.id for p in products]
    inv_qs = PharmacyInventory.objects.filter(
        product_id__in=product_ids,
        is_available=True,
        quantity__gt=0,
    )
    if pharmacy_ids is not None:
        inv_qs = inv_qs.filter(pharmacy_id__in=pharmacy_ids)
    vid = (variant_id or "").strip()
    if vid:
        inv_qs = inv_qs.filter(variant_id=vid)

    inv_rows = list(inv_qs.values("product_id", "pharmacy_id"))
    prod_by_id = {p.id: p for p in products}

    pharmacies_by_brand: dict[tuple, set[str]] = defaultdict(set)
    rep_product_by_brand: dict[tuple, str] = {}

    for row in inv_rows:
        pid = row["product_id"]
        ph_id = row["pharmacy_id"]
        p = prod_by_id.get(pid)
        if not p:
            continue
        bid = (p.brand_id or "").strip() or None
        bname = (p.brand_name or "").strip() or ""
        if bid:
            key = (bid, "")
        else:
            key = (None, (bname or (p.name or "").strip()).lower())
        pharmacies_by_brand[key].add(ph_id)
        rep_product_by_brand.setdefault(key, pid)

    out: list[dict] = []
    for key, ph_set in pharmacies_by_brand.items():
        rep_pid = rep_product_by_brand[key]
        rep = prod_by_id[rep_pid]
        bid_key, _name_key = key
        brand_id_out = bid_key if bid_key else None
        brand_name_out = (rep.brand_name or "").strip() or rep.name
        out.append(
            {
                "brandId": brand_id_out,
                "brandName": brand_name_out,
                "productId": rep_pid,
                "pharmacyCount": len(ph_set),
            }
        )

    out.sort(key=lambda x: (x["brandName"] or "").lower())
    return out


def list_pharmacies_for_product_brand(
    seed_product: MedicalProduct,
    *,
    brand_id: Optional[str] = None,
    brand_name: Optional[str] = None,
    pharmacy_ids: Optional[list[str]] = None,
) -> list[dict]:
    """
    Pharmacies carrying the given brand within the seed product's generic/name group.
    One row per pharmacy: minimum price, summed quantity, representative product_id for that price.
    """
    bid = (brand_id or "").strip() or None
    bn = (brand_name or "").strip() or None
    if not bid and not bn:
        return []

    group_qs = _product_group_queryset(seed_product)
    if bid:
        group_qs = group_qs.filter(brand_id=bid)
    else:
        group_qs = group_qs.filter(brand_name__iexact=bn)

    product_ids = list(group_qs.values_list("id", flat=True))
    if not product_ids:
        return []

    inv_qs = PharmacyInventory.objects.filter(
        product_id__in=product_ids,
        is_available=True,
        quantity__gt=0,
    )
    if pharmacy_ids is not None:
        inv_qs = inv_qs.filter(pharmacy_id__in=pharmacy_ids)

    inv_list = list(inv_qs)
    if not inv_list:
        return []

    by_pharmacy: dict[str, dict] = {}
    for inv in inv_list:
        ph_id = inv.pharmacy_id
        price = inv.price
        cur = by_pharmacy.get(ph_id)
        if cur is None:
            by_pharmacy[ph_id] = {
                "min_price": price,
                "quantity_sum": inv.quantity,
                "product_id": inv.product_id,
            }
        else:
            cur["quantity_sum"] += inv.quantity
            if price < cur["min_price"]:
                cur["min_price"] = price
                cur["product_id"] = inv.product_id

    ph_ids = list(by_pharmacy.keys())
    ph_qs = Pharmacy.objects.filter(
        id__in=ph_ids,
        is_active=True,
        certificate_status="approved",
    )
    if pharmacy_ids is not None:
        ph_qs = ph_qs.filter(id__in=pharmacy_ids)
    pharmacies = {p.id: p for p in ph_qs}

    rows: list[dict] = []
    for ph_id, agg in by_pharmacy.items():
        ph = pharmacies.get(ph_id)
        if not ph:
            continue
        rows.append(
            {
                "pharmacyId": str(ph_id),
                "pharmacyName": ph.name,
                "address": ph.address or "",
                "city": ph.city or "",
                "latitude": ph.latitude,
                "longitude": ph.longitude,
                "price": agg["min_price"],
                "quantity": agg["quantity_sum"],
                "productId": str(agg["product_id"]),
            }
        )

    rows.sort(key=lambda r: (r["pharmacyName"] or "").lower())
    return rows


def list_categories(*, owner_id: Optional[str] = None) -> Iterable[ProductCategory]:
    qs = ProductCategory.objects.all().order_by("name")
    if owner_id is not None:
        qs = qs.filter(owner_id=owner_id)
    return qs


def get_category_by_id(category_id: str) -> ProductCategory:
    return ProductCategory.objects.get(pk=category_id)


def create_category(
    *,
    owner_id: str,
    name: str,
    description: Optional[str] = None,
    parent_category_id: Optional[str] = None,
    requires_prescription: Optional[bool] = False,
) -> ProductCategory:
    now = timezone.now()
    return ProductCategory.objects.create(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        name=name,
        description=description or "",
        parent_category_id=parent_category_id or None,
        requires_prescription=requires_prescription or False,
        created_at=now,
        updated_at=now,
    )


def update_category(
    category_id: str,
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
    parent_category_id: Optional[str] = None,
    requires_prescription: Optional[bool] = None,
) -> ProductCategory:
    category = ProductCategory.objects.get(pk=category_id)
    update_fields: list[str] = []

    if name is not None:
        category.name = name
        update_fields.append("name")
    if description is not None:
        category.description = description
        update_fields.append("description")
    if parent_category_id is not None:
        category.parent_category_id = parent_category_id or None
        update_fields.append("parent_category_id")
    if requires_prescription is not None:
        category.requires_prescription = requires_prescription
        update_fields.append("requires_prescription")

    category.updated_at = timezone.now()
    update_fields.append("updated_at")
    category.save(update_fields=update_fields)
    return category


def delete_category(category_id: str) -> dict:
    category = ProductCategory.objects.get(pk=category_id)
    category.delete()
    return {"success": True, "id": category_id}


def _remove_old_media_file_if_ours(
    old_url: Optional[str], product_id: str, *, variant_id: Optional[str] = None
) -> None:
    if not old_url:
        return
    marker = "/media/"
    if marker not in old_url:
        return
    rel = old_url.split(marker, 1)[1].split("?", 1)[0].strip()
    base = f"products/{product_id}/"
    if variant_id:
        allowed_prefix = f"{base}variants/{variant_id}/"
    else:
        allowed_prefix = base
    if not rel.startswith(allowed_prefix):
        return
    abs_path = os.path.join(settings.MEDIA_ROOT, rel.replace("/", os.sep))
    if os.path.isfile(abs_path):
        try:
            os.remove(abs_path)
        except OSError:
            pass


def save_variant_image_upload(
    *,
    product_id: str,
    variant_id: str,
    uploaded_file: UploadedFile,
    build_absolute_uri,
) -> MedicalProductVariant:
    """
    Persist an image to MEDIA_ROOT, update variant image_url, return updated variant.
    """
    content_type = (uploaded_file.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_IMAGE_TYPES.get(content_type)
    if not ext and uploaded_file.name:
        guessed, _ = mimetypes.guess_type(uploaded_file.name)
        if guessed:
            ext = ALLOWED_IMAGE_TYPES.get(guessed.lower())
    if not ext:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")

    size = getattr(uploaded_file, "size", None) or 0
    if size > MAX_PRODUCT_IMAGE_BYTES:
        raise ValueError("Image must be 5 MB or smaller.")

    variant = get_variant_by_id(variant_id)
    if str(variant.product_id) != str(product_id):
        raise ValueError("Variant does not belong to this product.")

    # Gallery uploads use unique filenames so we append without deleting prior images.
    rel_path = f"products/{product_id}/variants/{variant_id}/{uuid.uuid4().hex}{ext}"
    abs_fs = os.path.join(settings.MEDIA_ROOT, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(abs_fs), exist_ok=True)

    with open(abs_fs, "wb") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    url_path = f"{settings.MEDIA_URL.rstrip('/')}/{rel_path}"
    absolute_url = build_absolute_uri(url_path)

    existing = getattr(variant, "image_urls", None)
    if not isinstance(existing, list):
        existing = []
    gallery = [str(u).strip() for u in existing if u and str(u).strip()]
    if absolute_url not in gallery:
        gallery.append(absolute_url)

    variant.image_url = absolute_url
    variant.image_urls = gallery if gallery else None
    variant.updated_at = timezone.now()
    variant.save(update_fields=["image_url", "image_urls", "updated_at"])
    return variant


def log_product_search(*, search_query: str, customer_id: Optional[str], results_count: int):
    """Persist a product search telemetry event."""
    ProductSearch.objects.create(
        id=str(uuid.uuid4()),
        customer_id=customer_id,
        search_query=search_query,
        results_count=results_count,
        searched_at=timezone.now(),
    )


def create_product(
    *,
    name: str,
    category_id: str,
    pharmacy_id: Optional[str] = None,
    generic_name: Optional[str] = None,
    brand_id: Optional[str] = None,
    brand_name: Optional[str] = None,
    description: Optional[str] = None,
    indications: Optional[str] = None,
    active_ingredients: Optional[str] = None,
    search_synonyms: Optional[str] = None,
    manufacturer: Optional[str] = None,
    requires_prescription: Optional[bool] = False,
    supplier: Optional[str] = None,
    low_stock_threshold: Optional[int] = None,
) -> MedicalProduct:
    now = timezone.now()
    return MedicalProduct.objects.create(
        id=str(uuid.uuid4()),
        pharmacy_id=pharmacy_id or None,
        name=name,
        generic_name=generic_name or "",
        brand_id=brand_id,
        brand_name=brand_name or "",
        description=description or "",
        indications=indications or "",
        active_ingredients=active_ingredients or "",
        search_synonyms=search_synonyms or "",
        manufacturer=manufacturer or "",
        category_id=category_id,
        requires_prescription=requires_prescription or False,
        supplier=supplier or "",
        low_stock_threshold=low_stock_threshold,
        created_at=now,
        updated_at=now,
    )


def update_product(
    product_id: str,
    *,
    name: Optional[str] = None,
    pharmacy_id: Optional[str] = None,
    generic_name: Optional[str] = None,
    brand_fields: Optional[tuple[Optional[str], str]] = None,
    description: Optional[str] = None,
    indications: Optional[str] = None,
    active_ingredients: Optional[str] = None,
    search_synonyms: Optional[str] = None,
    manufacturer: Optional[str] = None,
    category_id: Optional[str] = None,
    requires_prescription: Optional[bool] = None,
    supplier: Optional[str] = None,
    low_stock_threshold: Optional[int] = None,
) -> MedicalProduct:
    product = MedicalProduct.objects.get(pk=product_id)
    update_fields: list[str] = []

    if name is not None:
        product.name = name
        update_fields.append("name")
    if pharmacy_id is not None:
        product.pharmacy_id = pharmacy_id
        update_fields.append("pharmacy_id")
    if generic_name is not None:
        product.generic_name = generic_name
        update_fields.append("generic_name")
    if brand_fields is not None:
        bid, bn = brand_fields
        product.brand_id = bid
        product.brand_name = bn
        update_fields.extend(["brand_id", "brand_name"])
    if description is not None:
        product.description = description
        update_fields.append("description")
    if indications is not None:
        product.indications = indications
        update_fields.append("indications")
    if active_ingredients is not None:
        product.active_ingredients = active_ingredients
        update_fields.append("active_ingredients")
    if search_synonyms is not None:
        product.search_synonyms = search_synonyms
        update_fields.append("search_synonyms")
    if manufacturer is not None:
        product.manufacturer = manufacturer
        update_fields.append("manufacturer")
    if category_id is not None:
        product.category_id = category_id
        update_fields.append("category_id")
    if requires_prescription is not None:
        product.requires_prescription = requires_prescription
        update_fields.append("requires_prescription")
    if supplier is not None:
        product.supplier = supplier
        update_fields.append("supplier")
    if low_stock_threshold is not None:
        product.low_stock_threshold = low_stock_threshold
        update_fields.append("low_stock_threshold")

    product.updated_at = timezone.now()
    update_fields.append("updated_at")
    product.save(update_fields=update_fields)
    return product


def delete_product(product_id: str) -> dict:
    product = MedicalProduct.objects.get(pk=product_id)
    PharmacyInventory.objects.filter(product_id=product_id).delete()
    MedicalProductVariant.objects.filter(product_id=product_id).delete()
    product.delete()
    return {"success": True, "id": product_id}


def list_variants_by_product(product_id: str):
    return list(MedicalProductVariant.objects.filter(product_id=product_id).order_by("sort_order", "label"))


def next_variant_sort_order(product_id: str) -> int:
    agg = MedicalProductVariant.objects.filter(product_id=product_id).aggregate(m=Max("sort_order"))
    m = agg.get("m")
    return (m if m is not None else -1) + 1


def get_variant_by_id(variant_id: str) -> MedicalProductVariant:
    return MedicalProductVariant.objects.get(pk=variant_id)


def variant_image_urls_for_api(variant: MedicalProductVariant) -> list[str]:
    """
    Gallery URLs for API/landing: use image_urls when non-empty; else single image_url.
    """
    raw = getattr(variant, "image_urls", None)
    if isinstance(raw, list) and len(raw) > 0:
        out: list[str] = []
        for u in raw:
            s = str(u).strip() if u is not None else ""
            if s and s not in out:
                out.append(s)
        return out
    single = (getattr(variant, "image_url", None) or "").strip()
    return [single] if single else []


def _normalize_image_urls_list(urls: Optional[list]) -> Optional[list[str]]:
    if urls is None:
        return None
    out: list[str] = []
    for u in urls:
        s = str(u).strip() if u is not None else ""
        if s and s not in out:
            out.append(s)
    return out


def create_variant(
    *,
    product_id: str,
    label: str,
    sort_order: int = 0,
    unit: Optional[str] = None,
    strength: Optional[str] = None,
    dosage_form: Optional[str] = None,
    image_url: Optional[str] = None,
    image_urls: Optional[list[str]] = None,
) -> MedicalProductVariant:
    now = timezone.now()
    u = (unit or "piece").strip() or "piece"
    img = (image_url or "").strip() or ""
    urls_norm = _normalize_image_urls_list(image_urls)
    if urls_norm is not None and len(urls_norm) == 0:
        urls_norm = None
    if urls_norm is None and img:
        urls_norm = [img]
    return MedicalProductVariant.objects.create(
        id=str(uuid.uuid4()),
        product_id=product_id,
        label=label.strip(),
        unit=u,
        sort_order=sort_order,
        strength=(strength or "").strip() or "",
        dosage_form=(dosage_form or "").strip() or "",
        image_url=img,
        image_urls=urls_norm,
        created_at=now,
        updated_at=now,
    )


def update_variant(
    variant_id: str,
    *,
    label: Optional[str] = None,
    unit: Optional[str] = None,
    sort_order: Optional[int] = None,
    strength: Optional[str] = None,
    dosage_form: Optional[str] = None,
    image_url: Optional[str] = None,
    image_urls: Optional[list[str]] = None,
) -> MedicalProductVariant:
    variant = MedicalProductVariant.objects.get(pk=variant_id)
    update_fields: list[str] = []
    if label is not None:
        variant.label = label.strip()
        update_fields.append("label")
    if unit is not None:
        variant.unit = unit.strip() or "piece"
        update_fields.append("unit")
    if sort_order is not None:
        variant.sort_order = sort_order
        update_fields.append("sort_order")
    if strength is not None:
        variant.strength = strength.strip()
        update_fields.append("strength")
    if dosage_form is not None:
        variant.dosage_form = dosage_form.strip()
        update_fields.append("dosage_form")
    if image_url is not None:
        variant.image_url = image_url.strip()
        update_fields.append("image_url")
    if image_urls is not None:
        norm = _normalize_image_urls_list(image_urls)
        variant.image_urls = norm if norm else None
        update_fields.append("image_urls")
    variant.updated_at = timezone.now()
    update_fields.append("updated_at")
    variant.save(update_fields=update_fields)
    return variant


def delete_variant(variant_id: str) -> dict:
    variant = MedicalProductVariant.objects.get(pk=variant_id)
    product_id = variant.product_id
    if MedicalProductVariant.objects.filter(product_id=product_id).count() <= 1:
        raise ValueError("Cannot delete the last variant for a product.")
    variant.delete()
    return {"success": True, "id": variant_id}
