"""
Helpers for owner-scoped audit logging from DRF views.
"""
from __future__ import annotations

import logging
from typing import Any, Optional, Tuple

from rest_framework.request import Request

from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct, ProductCategory
from api.v1.staff.models import Staff

from .services import log_audit_event

logger = logging.getLogger(__name__)


def audit_actor_from_request(request: Request) -> Tuple[Optional[str], str]:
    """Returns (actor_user_id, actor_role) for the authenticated user."""
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return None, ""
    uid = str(getattr(user, "id", "") or "")
    role = str(getattr(user, "role", "") or "").strip() or "unknown"
    return uid or None, role[:32]


def owner_id_from_pharmacy_id(pharmacy_id: Optional[str]) -> Optional[str]:
    if not pharmacy_id:
        return None
    oid = Pharmacy.objects.filter(id=pharmacy_id).values_list("owner_id", flat=True).first()
    return str(oid) if oid else None


def owner_id_from_product_id(product_id: Optional[str]) -> Optional[str]:
    if not product_id:
        return None
    pid = (
        MedicalProduct.objects.filter(id=product_id)
        .values_list("pharmacy_id", flat=True)
        .first()
    )
    if not pid:
        return None
    return owner_id_from_pharmacy_id(str(pid))


def owner_id_from_category_id(category_id: Optional[str]) -> Optional[str]:
    if not category_id:
        return None
    oid = ProductCategory.objects.filter(id=category_id).values_list("owner_id", flat=True).first()
    return str(oid) if oid else None


def owner_id_for_staff_user(user_id: Optional[str]) -> Optional[str]:
    """Tenant owner id for a staff member's Staff profile."""
    if not user_id:
        return None
    oid = Staff.objects.filter(user_id=str(user_id)).values_list("owner_id", flat=True).first()
    return str(oid) if oid else None


def safe_log_audit_event(**kwargs: Any) -> None:
    try:
        log_audit_event(**kwargs)
    except Exception:
        logger.exception("audit log failed")
