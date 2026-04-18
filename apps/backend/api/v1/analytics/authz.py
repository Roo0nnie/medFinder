"""
Resolve owner scope for analytics endpoints: owners may only see their data;
admins may pass ownerId (required for owner-stats; optional for chart endpoints).
"""
from __future__ import annotations

from typing import Optional

from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request


def resolve_owner_id_for_owner_stats(request: Request) -> str:
    """
    GET owner-stats: admin must pass ownerId; owner always scoped to self.
    """
    user = request.user
    if not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
    role = getattr(user, "role", None) or ""
    if role == "admin":
        oid = request.query_params.get("ownerId")
        if not oid:
            raise ValidationError({"ownerId": "This query parameter is required for admin."})
        return str(oid).strip()
    if role == "owner":
        return str(user.id)
    raise PermissionDenied("Owner or admin access required.")


def resolve_owner_id_for_owner_charts(request: Request) -> Optional[str]:
    """
    monthly-sales / top-products: admin may omit ownerId for platform-wide aggregates;
    owner always scoped to self (query ownerId ignored).
    """
    user = request.user
    if not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
    role = getattr(user, "role", None) or ""
    if role == "admin":
        oid = request.query_params.get("ownerId")
        return str(oid).strip() if oid else None
    if role == "owner":
        return str(user.id)
    raise PermissionDenied("Owner or admin access required.")
