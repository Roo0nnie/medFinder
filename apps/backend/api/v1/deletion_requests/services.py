"""
DeletionRequest business logic and CRUD operations.
"""
import uuid
from typing import Optional

from django.db.models import QuerySet
from django.utils import timezone

from .models import DeletionRequest


def list_deletion_requests(
    *,
    pharmacy_id: Optional[str] = None,
    status: Optional[str] = None,
    pharmacy_ids: Optional[list[str]] = None,
    requested_by: Optional[str] = None,
) -> QuerySet[DeletionRequest]:
    qs = DeletionRequest.objects.all()

    if pharmacy_ids is not None:
        qs = qs.filter(pharmacy_id__in=pharmacy_ids)
    elif pharmacy_id:
        qs = qs.filter(pharmacy_id=pharmacy_id)

    if status:
        qs = qs.filter(status=status)

    if requested_by is not None:
        qs = qs.filter(requested_by=requested_by)

    return qs.order_by("-created_at")


def get_deletion_request_by_id(request_id: str) -> DeletionRequest:
    return DeletionRequest.objects.get(pk=request_id)


def create_deletion_request(
    *,
    product_id: str,
    pharmacy_id: str,
    requested_by: str,
    reason: Optional[str] = None,
) -> DeletionRequest:
    now = timezone.now()
    request_id = str(uuid.uuid4())
    return DeletionRequest.objects.create(
        id=request_id,
        product_id=product_id,
        pharmacy_id=pharmacy_id,
        requested_by=requested_by,
        reviewed_by=None,
        status="pending",
        reason=reason or "",
        created_at=now,
        updated_at=now,
    )


def update_deletion_request_status(
    request_id: str,
    *,
    reviewed_by: str,
    status: str,
) -> DeletionRequest:
    deletion_request = DeletionRequest.objects.get(pk=request_id)
    deletion_request.reviewed_by = reviewed_by
    deletion_request.status = status
    deletion_request.updated_at = timezone.now()
    deletion_request.save(update_fields=["reviewed_by", "status", "updated_at"])
    return deletion_request


