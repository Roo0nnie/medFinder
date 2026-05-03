"""
Inventory business logic and read-only operations.
"""
import uuid
from typing import Optional

from django.db.models import QuerySet
from django.utils import timezone

from api.v1.products.models import MedicalProductVariant

from .models import PharmacyInventory


def list_inventory(
    *,
    pharmacy_id: Optional[str] = None,
    product_id: Optional[str] = None,
    is_available: Optional[bool] = None,
) -> QuerySet[PharmacyInventory]:
    qs = PharmacyInventory.objects.all()

    if pharmacy_id:
        qs = qs.filter(pharmacy_id=pharmacy_id)

    if product_id:
        qs = qs.filter(product_id=product_id)

    if is_available is not None:
        qs = qs.filter(is_available=is_available)

    return qs.order_by("-updated_at")


def variant_label_map_for_inventory_qs(qs: QuerySet[PharmacyInventory]) -> dict[str, str]:
    """
    One query for distinct variant ids on this queryset, one query for labels.
    Used to avoid N+1 MedicalProductVariant lookups when listing inventory.
    """
    variant_ids = list(
        qs.exclude(variant_id__isnull=True)
        .exclude(variant_id="")
        .values_list("variant_id", flat=True)
        .distinct()
    )
    if not variant_ids:
        return {}
    rows = MedicalProductVariant.objects.filter(pk__in=variant_ids).values("id", "label")
    return {str(r["id"]): r["label"] for r in rows}


def get_inventory_by_id(inventory_id: str) -> PharmacyInventory:
    return PharmacyInventory.objects.get(pk=inventory_id)


def create_inventory(
    *,
    pharmacy_id: str,
    product_id: str,
    quantity: int,
    price,
    variant_id: Optional[str] = None,
    discount_price=None,
    expiry_date=None,
    batch_number=None,
    is_available: Optional[bool] = True,
    last_restocked=None,
) -> PharmacyInventory:
    now = timezone.now()
    return PharmacyInventory.objects.create(
        id=str(uuid.uuid4()),
        pharmacy_id=pharmacy_id,
        product_id=product_id,
        variant_id=variant_id or None,
        quantity=quantity,
        price=price,
        discount_price=discount_price,
        expiry_date=expiry_date,
        batch_number=batch_number or "",
        is_available=is_available if is_available is not None else True,
        last_restocked=last_restocked,
        created_at=now,
        updated_at=now,
    )


def update_inventory(
    inventory_id: str,
    *,
    variant_id: Optional[str] = None,
    quantity: Optional[int] = None,
    price=None,
    discount_price=None,
    expiry_date=None,
    batch_number=None,
    is_available: Optional[bool] = None,
    last_restocked=None,
) -> PharmacyInventory:
    record = PharmacyInventory.objects.get(pk=inventory_id)
    update_fields: list[str] = []

    if variant_id is not None:
        record.variant_id = variant_id or None
        update_fields.append("variant_id")
    if quantity is not None:
        record.quantity = quantity
        update_fields.append("quantity")
    if price is not None:
        record.price = price
        update_fields.append("price")
    if discount_price is not None:
        record.discount_price = discount_price
        update_fields.append("discount_price")
    if expiry_date is not None:
        record.expiry_date = expiry_date
        update_fields.append("expiry_date")
    if batch_number is not None:
        record.batch_number = batch_number
        update_fields.append("batch_number")
    if is_available is not None:
        record.is_available = is_available
        update_fields.append("is_available")
    if last_restocked is not None:
        record.last_restocked = last_restocked
        update_fields.append("last_restocked")

    record.updated_at = timezone.now()
    update_fields.append("updated_at")
    record.save(update_fields=update_fields)
    return record


def delete_inventory(inventory_id: str) -> dict:
    record = PharmacyInventory.objects.get(pk=inventory_id)
    record.delete()
    return {"success": True, "id": str(inventory_id)}

