"""
Brand search, owner links, and admin monitoring.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.analytics.audit_helpers import audit_actor_from_request, safe_log_audit_event
from api.v1.staff.models import Staff
from api.v1.users.permissions import IsAdmin

from . import services
from .serializers import (
    BrandCreateSerializer,
    BrandMineUpdateSerializer,
    BrandSerializer,
)


def _brand_owner_id(request) -> str | None:
    """Owner or staff: scoped owner; admin: optional ownerId query/body."""
    role = getattr(request.user, "role", None)
    if role == "owner":
        return str(request.user.id)
    if role == "staff":
        try:
            return Staff.objects.get(user_id=str(request.user.id)).owner_id
        except Staff.DoesNotExist:
            return None
    if role == "admin":
        oid = request.query_params.get("ownerId")
        if not oid and hasattr(request, "data") and request.data:
            oid = request.data.get("ownerId")
        return oid
    return None


class BrandSearchListView(APIView):
    """
    GET /v1/brands/?search=&limit=
    POST /v1/brands/ — resolve-or-create + link to current owner scope
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search") or ""
        limit_param = request.query_params.get("limit") or "20"
        try:
            limit = max(1, min(int(limit_param), 100))
        except ValueError:
            return Response(
                {"detail": "limit must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        brands = services.search_brands(search=search, limit=limit)
        return Response(BrandSerializer(brands, many=True).data)

    def post(self, request):
        if getattr(request.user, "role", None) not in ("owner", "staff", "admin"):
            return Response(
                {"detail": "Owner, staff, or admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = BrandCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owner_id = _brand_owner_id(request)
        if not owner_id:
            return Response(
                {"detail": "ownerId is required for admin, or valid staff profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            brand = services.resolve_or_create_and_link(owner_id, serializer.validated_data["name"])
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(owner_id),
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="CREATE",
            resource_type="OwnerBrand",
            resource_id=str(brand.id),
            details=brand.name or "",
        )
        return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)


class BrandMineListView(APIView):
    """GET /v1/brands/mine/ — brands linked to current owner scope."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        owner_id = _brand_owner_id(request)
        if not owner_id:
            return Response(
                {"detail": "ownerId is required for admin, or valid staff profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        brands = services.list_owner_brands(owner_id)
        return Response(BrandSerializer(brands, many=True).data)


class BrandMineDetailView(APIView):
    """
    PUT /v1/brands/mine/<brandId>/ — rename / reassign products for owner scope
    DELETE /v1/brands/mine/<brandId>/ — unlink owner_brands row if no products use it
    """

    permission_classes = [IsAuthenticated]

    def put(self, request, brand_id):
        if getattr(request.user, "role", None) not in ("owner", "staff", "admin"):
            return Response(
                {"detail": "Owner, staff, or admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        owner_id = _brand_owner_id(request)
        if not owner_id:
            return Response(
                {"detail": "ownerId is required for admin, or valid staff profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BrandMineUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            brand = services.owner_update_brand(owner_id, brand_id, serializer.validated_data["name"])
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(owner_id),
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="UPDATE",
            resource_type="OwnerBrand",
            resource_id=str(brand_id),
            details=brand.name or "",
        )
        return Response(BrandSerializer(brand).data)

    def delete(self, request, brand_id):
        if getattr(request.user, "role", None) not in ("owner", "staff", "admin"):
            return Response(
                {"detail": "Owner, staff, or admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        owner_id = _brand_owner_id(request)
        if not owner_id:
            return Response(
                {"detail": "ownerId is required for admin, or valid staff profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            services.unlink_owner_brand(owner_id, brand_id)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(owner_id),
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="DELETE",
            resource_type="OwnerBrand",
            resource_id=str(brand_id),
            details="unlink",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminBrandListView(APIView):
    """GET /v1/admin/brands/ — all brands with usage counts."""

    permission_classes = [IsAdmin]

    def get(self, request):
        rows = services.list_brands_admin()
        payload = [
            {
                "id": r["brand"].id,
                "name": r["brand"].name,
                "normalizedName": r["brand"].normalized_name,
                "ownerCount": r["owner_count"],
                "productCount": r["product_count"],
                "createdAt": r["brand"].created_at,
                "updatedAt": r["brand"].updated_at,
            }
            for r in rows
        ]
        return Response(payload)


class AdminBrandDetailView(APIView):
    """DELETE /v1/admin/brands/<id>/ — only when unused."""

    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            services.admin_delete_brand_safe(pk)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        actor_uid, actor_role = audit_actor_from_request(request)
        # No owner/business scope: store actor user id as owner_id for platform-wide admin audit views.
        safe_log_audit_event(
            owner_id=str(actor_uid or getattr(request.user, "id", "") or ""),
            actor_user_id=actor_uid,
            actor_role=actor_role or "admin",
            action="DELETE",
            resource_type="Brand",
            resource_id=str(pk),
            details="admin_catalog_delete",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
