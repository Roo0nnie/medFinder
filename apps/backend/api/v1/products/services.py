"""
Product business logic and read-only operations.
"""
import uuid
from typing import Iterable, Optional

from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import QuerySet
from django.utils import timezone

from api.v1.brands.models import Brand, OwnerBrand
from api.v1.inventory.models import PharmacyInventory

from .models import MedicalProduct, MedicalProductVariant, ProductCategory, ProductSearch


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
        if prefix:
            raw = _build_prefix_raw_query(query)
            search_query = SearchQuery(raw, search_type="raw", config="english") if raw else None
        else:
            search_query = SearchQuery(query, search_type=search_type, config="english")

        vector = (
            SearchVector("name", weight="A", config="english")
            + SearchVector("brand_name", weight="B", config="english")
            + SearchVector("generic_name", weight="B", config="english")
            + SearchVector("manufacturer", weight="C", config="english")
            + SearchVector("dosage_form", weight="C", config="english")
            + SearchVector("strength", weight="C", config="english")
            + SearchVector("description", weight="D", config="english")
        )

        if search_query is not None:
            qs = (
                qs.annotate(rank=SearchRank(vector, search_query))
                .filter(rank__gt=0)
                .order_by("-rank", "name")
            )
    else:
        qs = qs.order_by("name")

    if offset is not None:
        qs = qs[offset:]
    if limit is not None:
        qs = qs[:limit]

    return qs


def get_product_by_id(product_id: str) -> MedicalProduct:
    return MedicalProduct.objects.get(pk=product_id)


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
) -> ProductCategory:
    now = timezone.now()
    return ProductCategory.objects.create(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        name=name,
        description=description or "",
        parent_category_id=parent_category_id or None,
        created_at=now,
        updated_at=now,
    )


def update_category(
    category_id: str,
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
    parent_category_id: Optional[str] = None,
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

    category.updated_at = timezone.now()
    update_fields.append("updated_at")
    category.save(update_fields=update_fields)
    return category


def delete_category(category_id: str) -> dict:
    category = ProductCategory.objects.get(pk=category_id)
    category.delete()
    return {"success": True, "id": category_id}


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
    unit: str,
    pharmacy_id: Optional[str] = None,
    generic_name: Optional[str] = None,
    brand_id: Optional[str] = None,
    brand_name: Optional[str] = None,
    description: Optional[str] = None,
    manufacturer: Optional[str] = None,
    dosage_form: Optional[str] = None,
    strength: Optional[str] = None,
    requires_prescription: Optional[bool] = False,
    image_url: Optional[str] = None,
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
        manufacturer=manufacturer or "",
        category_id=category_id,
        dosage_form=dosage_form or "",
        strength=strength or "",
        unit=unit,
        requires_prescription=requires_prescription or False,
        image_url=image_url or "",
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
    manufacturer: Optional[str] = None,
    category_id: Optional[str] = None,
    dosage_form: Optional[str] = None,
    strength: Optional[str] = None,
    unit: Optional[str] = None,
    requires_prescription: Optional[bool] = None,
    image_url: Optional[str] = None,
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
    if manufacturer is not None:
        product.manufacturer = manufacturer
        update_fields.append("manufacturer")
    if category_id is not None:
        product.category_id = category_id
        update_fields.append("category_id")
    if dosage_form is not None:
        product.dosage_form = dosage_form
        update_fields.append("dosage_form")
    if strength is not None:
        product.strength = strength
        update_fields.append("strength")
    if unit is not None:
        product.unit = unit
        update_fields.append("unit")
    if requires_prescription is not None:
        product.requires_prescription = requires_prescription
        update_fields.append("requires_prescription")
    if image_url is not None:
        product.image_url = image_url
        update_fields.append("image_url")
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


def get_variant_by_id(variant_id: str) -> MedicalProductVariant:
    return MedicalProductVariant.objects.get(pk=variant_id)


def create_variant(
    *,
    product_id: str,
    label: str,
    sort_order: int = 0,
) -> MedicalProductVariant:
    now = timezone.now()
    return MedicalProductVariant.objects.create(
        id=str(uuid.uuid4()),
        product_id=product_id,
        label=label.strip(),
        sort_order=sort_order,
        created_at=now,
        updated_at=now,
    )


def update_variant(
    variant_id: str,
    *,
    label: Optional[str] = None,
    sort_order: Optional[int] = None,
) -> MedicalProductVariant:
    variant = MedicalProductVariant.objects.get(pk=variant_id)
    update_fields: list[str] = []
    if label is not None:
        variant.label = label.strip()
        update_fields.append("label")
    if sort_order is not None:
        variant.sort_order = sort_order
        update_fields.append("sort_order")
    variant.updated_at = timezone.now()
    update_fields.append("updated_at")
    variant.save(update_fields=update_fields)
    return variant


def delete_variant(variant_id: str) -> dict:
    variant = MedicalProductVariant.objects.get(pk=variant_id)
    variant.delete()
    return {"success": True, "id": variant_id}
