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
    """
    GET list/search staff (with pagination and FTS search).

    - Admins can see all staff.
    - Owners only see staff connected to their pharmacies via PharmacyStaff.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get pagination and search params
        search_query = request.query_params.get("search", None)
        raw_is_active = request.query_params.get("is_active", None)
        if raw_is_active is None:
            is_active = None
        elif raw_is_active.lower() == "false":
            is_active = False
        else:
            is_active = True
        limit = request.query_params.get("limit", None)
        offset = request.query_params.get("offset", None)

        # Parse limit and offset
        try:
            limit = int(limit) if limit else None
            offset = int(offset) if offset else None
        except (ValueError, TypeError):
            limit = None
            offset = None

        # Get staff with filters, scoping by role/ownership
        user = request.user
        if getattr(user, "role", None) == "owner":
            base_queryset = Staff.objects.filter(owner_id=str(user.id))
        else:
            # Admins (and other privileged roles) can see all staff
            base_queryset = Staff.objects.all()

        # Apply filters twice: once without pagination for total count,
        # and once with pagination for the current page slice.
        filtered_queryset = services._apply_staff_filters(
            base_queryset,
            is_active=is_active,
            search_query=search_query,
            limit=None,
            offset=None,
        )
        total_count = filtered_queryset.count()

        staff_page = services._apply_staff_filters(
            base_queryset,
            is_active=is_active,
            search_query=search_query,
            limit=limit,
            offset=offset,
        )

        # Serialize
        serializer = StaffListSerializer(staff_page, many=True)
        response_data = {
            "data": serializer.data,
            "count": total_count,
            "search": search_query,
        }
        # Only include isActive when a filter was explicitly applied
        if is_active is not None:
            response_data["isActive"] = is_active

        return Response(response_data)


class StaffCreateView(APIView):
    """POST create a new staff profile. Admin/owner only (via IsOwner)."""

    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        in_serializer = StaffCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        staff = services.create_staff(
            owner_id=str(request.user.id),
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

        # Enforce owner scoping for owner-role users on detail access.
        user = request.user
        if getattr(user, "role", None) == "owner" and str(staff.owner_id) != str(
            user.id
        ):
            return Response(
                {"detail": "You do not have permission to access this staff member"},
                status=status.HTTP_403_FORBIDDEN,
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

        # Enforce owner scoping for owner-role users on update.
        user = request.user
        if getattr(user, "role", None) == "owner" and str(staff.owner_id) != str(
            user.id
        ):
            return Response(
                {"detail": "You do not have permission to modify this staff member"},
                status=status.HTTP_403_FORBIDDEN,
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

        # Enforce owner scoping for owner-role users on delete.
        user = request.user
        if getattr(user, "role", None) == "owner" and str(staff.owner_id) != str(
            user.id
        ):
            return Response(
                {"detail": "You do not have permission to delete this staff member"},
                status=status.HTTP_403_FORBIDDEN,
            )

        result = services.delete_staff(pk)
        return Response(result)
