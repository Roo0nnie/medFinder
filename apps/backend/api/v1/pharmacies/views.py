"""
Pharmacy API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.analytics.audit_helpers import audit_actor_from_request, safe_log_audit_event
from api.v1.staff.models import Staff
from api.v1.users.permissions import IsOwner

from .models import Pharmacy
from . import services
from .serializers import (
    PharmacyCertificateReviewSerializer,
    PharmacyCertificateUploadSerializer,
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


def user_can_view_unverified_pharmacy(request, pharmacy: Pharmacy) -> bool:
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

        verification_status = request.query_params.get("verificationStatus")
        if verification_status == "":
            verification_status = None

        pharmacies = services.get_all_pharmacies(
            is_active=is_active,
            search_query=search_query,
            city=city,
            state=state,
        )

        role = getattr(request.user, "role", None) if getattr(request.user, "is_authenticated", False) else None
        if role == "admin":
            if verification_status:
                pharmacies = pharmacies.filter(certificate_status=verification_status)
        else:
            pharmacies = pharmacies.filter(certificate_status="approved", is_active=True)

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
            owner_image=data.get("ownerImage"),
            google_map_embed=data.get("googleMapEmbed"),
            social_links=data.get("socialLinks"),
        )

        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(pharmacy.owner_id),
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="CREATE",
            resource_type="Pharmacy",
            resource_id=pharmacy.id,
            details=pharmacy.name or "",
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

        if pharmacy.certificate_status != "approved" and not user_can_view_unverified_pharmacy(
            request, pharmacy
        ):
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

        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(pharmacy.owner_id),
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="UPDATE",
            resource_type="Pharmacy",
            resource_id=pharmacy.id,
            details=pharmacy.name or "",
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

        oid = str(pharmacy.owner_id)
        pid = pharmacy.id
        pname = pharmacy.name or ""
        actor_uid, actor_role = audit_actor_from_request(request)
        result = services.delete_pharmacy(pk)
        safe_log_audit_event(
            owner_id=oid,
            actor_user_id=actor_uid,
            actor_role=actor_role,
            action="DELETE",
            resource_type="Pharmacy",
            resource_id=str(pid),
            details=pname,
        )
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


class PharmacyCertificateUploadView(APIView):
    """
    POST multipart/form-data with fields `file` and `certificateNumber`.
    Owner of the pharmacy or admin only.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            pharmacy = services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response({"detail": "Pharmacy not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != "admin" and pharmacy.owner_id != str(request.user.id):
            return Response(
                {"detail": "You do not have permission to upload this certificate."},
                status=status.HTTP_403_FORBIDDEN,
            )

        in_serializer = PharmacyCertificateUploadSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        certificate_number = in_serializer.validated_data["certificateNumber"]

        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Missing file field."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pharmacy = services.save_pharmacy_certificate_upload(
                pharmacy_id=pk,
                certificate_number=certificate_number,
                uploaded_file=upload,
                build_absolute_uri=lambda path: request.build_absolute_uri(path),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        out_serializer = PharmacyDetailSerializer(pharmacy)
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class PharmacyCertificateReviewView(APIView):
    """
    POST admin review action for certificate with status approved/rejected.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"detail": "Only admins can review certificates."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            services.get_pharmacy_by_id(pk)
        except Pharmacy.DoesNotExist:
            return Response({"detail": "Pharmacy not found"}, status=status.HTTP_404_NOT_FOUND)

        in_serializer = PharmacyCertificateReviewSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        status_value = in_serializer.validated_data["status"]
        review_note = in_serializer.validated_data.get("reviewNote")

        try:
            pharmacy = services.review_pharmacy_certificate(
                pharmacy_id=pk,
                reviewer_id=str(request.user.id),
                status=status_value,
                review_note=review_note,
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
