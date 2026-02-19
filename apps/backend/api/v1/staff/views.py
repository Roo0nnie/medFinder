"""
Staff API views. List, search, retrieve, create, update, delete.
Uses DRF permission classes (IsAuthenticated, IsOwner) instead of inline role checks.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.users.permissions import IsOwner

from .models import Staff
from . import services
from .serializers import (
    StaffListSerializer,
    StaffDetailSerializer,
    StaffCreateInputSerializer,
    StaffUpdateInputSerializer,
)


class StaffListSearchView(APIView):
    """GET list/search staff (with pagination and FTS search)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get pagination and search params
        search_query = request.query_params.get("search", None)
        is_active = request.query_params.get("is_active", "true").lower() != "false"
        limit = request.query_params.get("limit", None)
        offset = request.query_params.get("offset", None)

        # Parse limit and offset
        try:
            limit = int(limit) if limit else None
            offset = int(offset) if offset else None
        except (ValueError, TypeError):
            limit = None
            offset = None

        # Get staff with filters
        staff = services.get_all_staff(
            is_active=is_active,
            search_query=search_query,
            limit=limit,
            offset=offset,
        )

        # Serialize
        serializer = StaffListSerializer(staff, many=True)
        return Response(
            {
                "data": serializer.data,
                "count": len(serializer.data),
                "search": search_query,
                "isActive": is_active,
            }
        )


class StaffCreateView(APIView):
    """POST create a new staff profile. Admin/owner only (via IsOwner)."""

    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        in_serializer = StaffCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        staff = services.create_staff(
            user_id=data["userId"],
            department=data["department"],
            position=data["position"],
            specialization=data.get("specialization") or None,
            bio=data.get("bio") or None,
            phone=data.get("phone") or None,
            is_active=data.get("isActive", True),
        )

        out_serializer = StaffDetailSerializer(staff)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class StaffDetailView(APIView):
    """GET details, PUT update, DELETE by id. List/get: authenticated; create/update/delete: IsOwner."""

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            staff = services.get_staff_by_id(pk)
        except Staff.DoesNotExist:
            return Response(
                {"detail": "Staff member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = StaffDetailSerializer(staff)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            staff = services.get_staff_by_id(pk)
        except Staff.DoesNotExist:
            return Response(
                {"detail": "Staff member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        in_serializer = StaffUpdateInputSerializer(data=request.data, partial=True)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        staff = services.update_staff(
            pk,
            department=data.get("department"),
            position=data.get("position"),
            specialization=data.get("specialization"),
            bio=data.get("bio"),
            phone=data.get("phone"),
            is_active=data.get("isActive"),
        )

        out_serializer = StaffDetailSerializer(staff)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            staff = services.get_staff_by_id(pk)
        except Staff.DoesNotExist:
            return Response(
                {"detail": "Staff member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = services.delete_staff(pk)
        return Response(result)
