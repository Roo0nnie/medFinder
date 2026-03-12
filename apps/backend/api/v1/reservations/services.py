"""
Reservation business logic and CRUD operations.
"""
import uuid
from typing import Optional

from django.db.models import QuerySet
from django.utils import timezone

from .models import ProductReservation


def list_reservations(
    *,
    customer_id: Optional[str] = None,
    inventory_id: Optional[str] = None,
    status: Optional[str] = None,
) -> QuerySet[ProductReservation]:
    qs = ProductReservation.objects.all()

    if customer_id:
        qs = qs.filter(customer_id=customer_id)

    if inventory_id:
        qs = qs.filter(inventory_id=inventory_id)

    if status:
        qs = qs.filter(status=status)

    return qs.order_by("-created_at")


def get_reservation_by_id(reservation_id: str) -> ProductReservation:
    return ProductReservation.objects.get(pk=reservation_id)


def create_reservation(
    *,
    customer_id: str,
    inventory_id: str,
    quantity: int,
) -> ProductReservation:
    now = timezone.now()
    reservation_id = str(uuid.uuid4())
    return ProductReservation.objects.create(
        id=reservation_id,
        customer_id=customer_id,
        inventory_id=inventory_id,
        quantity=quantity,
        status="pending",
        expires_at=None,
        created_at=now,
        updated_at=now,
    )


def update_reservation(
    reservation_id: str,
    *,
    quantity: Optional[int] = None,
    status: Optional[str] = None,
) -> ProductReservation:
    reservation = ProductReservation.objects.get(pk=reservation_id)
    update_fields: list[str] = []

    if quantity is not None:
        reservation.quantity = quantity
        update_fields.append("quantity")

    if status is not None:
        reservation.status = status
        update_fields.append("status")

    reservation.updated_at = timezone.now()
    update_fields.append("updated_at")

    reservation.save(update_fields=update_fields)
    return reservation


def cancel_reservation(reservation_id: str) -> dict:
    reservation = ProductReservation.objects.get(pk=reservation_id)
    reservation.status = "cancelled"
    reservation.updated_at = timezone.now()
    reservation.save(update_fields=["status", "updated_at"])
    return {"success": True, "id": str(reservation_id)}


