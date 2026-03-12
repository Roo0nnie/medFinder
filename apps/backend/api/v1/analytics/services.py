"""
Analytics business logic and aggregate queries.
"""
from typing import Any, Dict, List, Optional

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct
from api.v1.reservations.models import ProductReservation


def get_platform_stats() -> Dict[str, int]:
    """
    Aggregate high-level platform metrics.
    """
    total_pharmacies = Pharmacy.objects.count()
    total_inventory_items = PharmacyInventory.objects.count()
    total_reservations = ProductReservation.objects.count()

    return {
        "totalPharmacies": total_pharmacies,
        "totalInventoryItems": total_inventory_items,
        "totalReservations": total_reservations,
    }


def get_owner_stats(owner_id: str) -> Dict[str, int]:
    """
    Aggregate metrics scoped to a specific owner.
    """
    pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
    pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))

    inventory_items_count = PharmacyInventory.objects.filter(
        pharmacy_id__in=pharmacy_ids
    ).count()

    inventory_ids = list(
        PharmacyInventory.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
    )
    reservations_count = ProductReservation.objects.filter(
        inventory_id__in=inventory_ids
    ).count()

    return {
        "pharmaciesCount": pharmacies_qs.count(),
        "inventoryItemsCount": inventory_items_count,
        "reservationsCount": reservations_count,
    }


def get_staff_stats(user_id: str) -> Dict[str, int]:
    """
    Aggregate metrics scoped to a staff user.
    Currently based on reservations made by the user.
    """
    active_reservations = ProductReservation.objects.filter(
        customer_id=user_id,
        status__in=["pending", "confirmed"],
    ).count()
    completed_reservations = ProductReservation.objects.filter(
        customer_id=user_id,
        status="completed",
    ).count()

    return {
        "activeReservations": active_reservations,
        "completedReservations": completed_reservations,
    }


def get_monthly_sales(*, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Simple monthly sales aggregation based on completed reservations.
    """
    reservations = ProductReservation.objects.filter(status="completed")

    if owner_id:
        pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
        pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))
        inventory_ids = list(
            PharmacyInventory.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
        )
        reservations = reservations.filter(inventory_id__in=inventory_ids)

    qs = (
        reservations.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    data: List[Dict[str, Any]] = []
    for row in qs:
        month = row["month"]
        data.append(
            {
                "name": month.strftime("%b") if month else "",
                "sales": float(row["total"]),
            }
        )
    return data


def get_top_products(
    *,
    owner_id: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Compute top products by number of inventory entries, optionally scoped to an owner.
    """
    inventory_qs = PharmacyInventory.objects.all()

    if owner_id:
        pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
        pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))
        inventory_qs = inventory_qs.filter(pharmacy_id__in=pharmacy_ids)

    aggregated = (
        inventory_qs.values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )

    product_ids = [row["product_id"] for row in aggregated]
    product_map = {
        p.id: p.name
        for p in MedicalProduct.objects.filter(id__in=product_ids)
    }

    results: List[Dict[str, Any]] = []
    for row in aggregated:
        product_id = row["product_id"]
        name = product_map.get(product_id, product_id)
        results.append(
            {
                "name": name,
                "value": float(row["total"]),
            }
        )
    return results


