"""
DeletionRequest API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.inventory.views import _can_modify_inventory, _pharmacy_ids_for_user
from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct
from api.v1.products import services as product_services

from . import services
from .models import DeletionRequest
from .serializers import (
    CreateDeletionRequestInputSerializer,
    DeletionRequestSerializer,
)


def _allowed_pharmacy_ids_for_list(request):
    """Return allowed pharmacy IDs for list scope, or None for admin (all)."""
    if not request.user or not request.user.is_authenticated:
        return []
    role = getattr(request.user, "role", None)
    if role == "admin":
        return None  # all
    ids = list(_pharmacy_ids_for_user(request.user))
    return ids if ids else []


class DeletionRequestListCreateView(APIView):
    """
    GET list deletion requests (scoped by role), POST create a new deletion request.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get(self, request):
        pharmacy_id = request.query_params.get("pharmacyId")
        status_param = request.query_params.get("status")

        allowed = _allowed_pharmacy_ids_for_list(request)
        if allowed is not None and len(allowed) == 0:
            serializer = DeletionRequestSerializer([], many=True)
            return Response(serializer.data)

        pharmacy_ids = allowed if allowed is not None else None
        requested_by = None
        if getattr(request.user, "role", None) == "staff":
            requested_by = str(request.user.id)

        requests_qs = services.list_deletion_requests(
            pharmacy_id=pharmacy_id if pharmacy_ids is None else None,
            status=status_param,
            pharmacy_ids=pharmacy_ids,
            requested_by=requested_by,
        )
        serializer = DeletionRequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateDeletionRequestInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        pharmacy_id = data["pharmacyId"]
        product_id = data["productId"]

        if not _can_modify_inventory(request.user, pharmacy_id):
            return Response(
                {"detail": "You do not have permission to request deletion for this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            product = MedicalProduct.objects.get(pk=product_id)
        except MedicalProduct.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if str(product.pharmacy_id or "") != str(pharmacy_id):
            return Response(
                {"detail": "Product does not belong to this pharmacy."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deletion_request = services.create_deletion_request(
            product_id=product_id,
            pharmacy_id=pharmacy_id,
            requested_by=str(request.user.id),
            reason=data.get("reason"),
        )

        out_serializer = DeletionRequestSerializer(deletion_request)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class DeletionRequestDetailView(APIView):
    """
    GET a single deletion request by id, POST to update status (approve/reject).
    Only owner of the pharmacy or admin can approve/reject.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            deletion_request = services.get_deletion_request_by_id(pk)
        except DeletionRequest.DoesNotExist:
            return Response(
                {"detail": "Deletion request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DeletionRequestSerializer(deletion_request)
        return Response(serializer.data)

    def _can_review(self, request, deletion_request):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, "role", None) == "admin":
            return True
        if getattr(request.user, "role", None) != "owner":
            return False
        try:
            pharmacy = Pharmacy.objects.get(pk=deletion_request.pharmacy_id)
            return str(pharmacy.owner_id) == str(request.user.id)
        except Pharmacy.DoesNotExist:
            return False

    def post(self, request, pk):
        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return Response(
                {"detail": "Invalid action. Use 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            deletion_request = services.get_deletion_request_by_id(pk)
        except DeletionRequest.DoesNotExist:
            return Response(
                {"detail": "Deletion request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._can_review(request, deletion_request):
            return Response(
                {"detail": "Only the pharmacy owner or admin can approve or reject this request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if deletion_request.status != "pending":
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_value = "approved" if action == "approve" else "rejected"
        deletion_request = services.update_deletion_request_status(
            pk,
            reviewed_by=str(request.user.id),
            status=status_value,
        )

        if action == "approve":
            try:
                product_services.delete_product(str(deletion_request.product_id))
            except Exception:
                pass

        serializer = DeletionRequestSerializer(deletion_request)
        return Response(serializer.data)


