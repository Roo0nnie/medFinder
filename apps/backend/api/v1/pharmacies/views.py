"""
Pharmacy API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.users.permissions import IsOwner

from .models import Pharmacy
from . import services
from .serializers import (
    PharmacyCreateInputSerializer,
    PharmacyDetailSerializer,
    PharmacyListSerializer,
    PharmacyUpdateInputSerializer,
)


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


class MyPharmaciesView(APIView):
    """
    GET pharmacies owned by the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        pharmacies = services.get_pharmacies_by_owner(str(request.user.id))
        serializer = PharmacyListSerializer(pharmacies, many=True)
        return Response(serializer.data)

