"""
Inventory business logic and read-only operations.
"""
from typing import Optional

from django.db.models import QuerySet

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


def get_inventory_by_id(inventory_id: str) -> PharmacyInventory:
    return PharmacyInventory.objects.get(pk=inventory_id)


