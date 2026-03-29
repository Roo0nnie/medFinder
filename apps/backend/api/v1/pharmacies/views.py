"""
Pharmacy API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.staff.models import Staff
from api.v1.users.permissions import IsOwner

from .models import Pharmacy
from . import services
from .serializers import (
    PharmacyCreateInputSerializer,
    PharmacyDetailSerializer,
    PharmacyListSerializer,
    PharmacyUpdateInputSerializer,
)


def user_can_view_inactive_pharmacy(request, pharmacy: Pharmacy) -> bool:
    """Owners, admins, and staff of the owning business may view inactive pharmacies."""
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return False
    role = getattr(user, "role", None)
    if role == "admin":
        return True
    if role == "owner" and pharmacy.owner_id == str(user.id):
        return True
    if role == "staff":
        try:
            staff_profile = Staff.objects.get(user_id=str(user.id))
        except Staff.DoesNotExist:
            return False
        return staff_profile.owner_id == pharmacy.owner_id
    return False


class PharmacyListView(APIView):
    """
    GET list/search pharmacies.
    Public read, optional filters via query params.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        search_query = request.query_params.get("search")
        city = request.query_params.get("city")
        state = request.query_params.get("state")
        is_active_param = request.query_params.get("is_active")

        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() != "false"

        pharmacies = services.get_all_pharmacies(
            is_active=is_active,
            search_query=search_query,
            city=city,
            state=state,
        )
        serializer = PharmacyListSerializer(pharmacies, many=True)
        return Response(serializer.data)


class PharmacyCreateView(APIView):
    """
    POST create a new pharmacy.
    Owner/Admin only via IsOwner.
    """

    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        # Owners are limited to a single pharmacy record.
        existing_count = services.get_pharmacies_by_owner(str(request.user.id)).count()
        if existing_count >= 1 and getattr(request.user, "role", None) == "owner":
            return Response(
                {"detail": "Owners may only create one pharmacy. Edit your existing pharmacy instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        in_serializer = PharmacyCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        pharmacy = services.create_pharmacy(
            owner_id=str(request.user.id),
            name=data["name"],
            description=data.get("description"),
            address=data["address"],
            city=data["city"],
            state=data["state"],
            zip_code=data["zipCode"],
            country=data.get("country") or "US",
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            operating_hours=data.get("operatingHours"),
            logo=data.get("logo"),
            owner_image=data.get("ownerImage"),
            google_map_embed=data.get("googleMapEmbed"),
            social_links=data.get("socialLinks"),
        )

        out_serializer = PharmacyDetailSerializer(pharmacy)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class PharmacyDetailView(APIView):
    """
    GET details, PUT update, DELETE by id.
    GET is public; modifications require owner/admin (IsOwner).
    """

    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsOwner()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            pharmacy = services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {"detail": "Pharmacy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not pharmacy.is_active and not user_can_view_inactive_pharmacy(request, pharmacy):
            return Response(
                {"detail": "Pharmacy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PharmacyDetailSerializer(pharmacy)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            pharmacy = services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {"detail": "Pharmacy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.role != "admin" and pharmacy.owner_id != str(request.user.id):
            return Response(
                {"detail": "You do not have permission to modify this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        in_serializer = PharmacyUpdateInputSerializer(data=request.data, partial=True)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        pharmacy = services.update_pharmacy(
            pk,
            name=data.get("name"),
            description=data.get("description"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip_code=data.get("zipCode"),
            country=data.get("country"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            operating_hours=data.get("operatingHours"),
            is_active=data.get("isActive"),
            logo=data.get("logo"),
            owner_image=data.get("ownerImage"),
            google_map_embed=data.get("googleMapEmbed"),
            social_links=data.get("socialLinks"),
        )

        out_serializer = PharmacyDetailSerializer(pharmacy)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            pharmacy = services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {"detail": "Pharmacy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.role != "admin" and pharmacy.owner_id != str(request.user.id):
            return Response(
                {"detail": "You do not have permission to modify this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        result = services.delete_pharmacy(pk)
        return Response(result)


class PharmacyImageUploadView(APIView):
    """
    POST multipart/form-data with field `file` and query param `kind=logo` or `kind=owner`.
    Owner of the pharmacy or admin only.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            pharmacy = services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {"detail": "Pharmacy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.role != "admin" and pharmacy.owner_id != str(request.user.id):
            return Response(
                {"detail": "You do not have permission to modify this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        kind = (request.query_params.get("kind") or "").strip().lower()
        if kind not in ("logo", "owner"):
            return Response(
                {"detail": "Query parameter kind must be logo or owner."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "Missing file field."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pharmacy = services.save_pharmacy_image_upload(
                pharmacy_id=pk,
                kind=kind,
                uploaded_file=upload,
                build_absolute_uri=lambda path: request.build_absolute_uri(path),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        out_serializer = PharmacyDetailSerializer(pharmacy)
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class MyPharmaciesView(APIView):
    """
    GET pharmacies owned by the authenticated user (owner) or by the staff's owner (staff).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None)
        if role == "staff":
            try:
                staff_profile = Staff.objects.get(user_id=str(request.user.id))
                pharmacies = services.get_pharmacies_by_owner(staff_profile.owner_id)
            except Staff.DoesNotExist:
                pharmacies = []
            else:
                pharmacies = list(pharmacies)
        else:
            pharmacies = services.get_pharmacies_by_owner(str(request.user.id))
        serializer = PharmacyListSerializer(pharmacies, many=True)
        return Response(serializer.data)
