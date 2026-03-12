"""
DeletionRequest API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import DeletionRequest
from .serializers import (
    CreateDeletionRequestInputSerializer,
    DeletionRequestSerializer,
)


class DeletionRequestListCreateView(APIView):
    """
    GET list deletion requests, POST create a new deletion request.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        pharmacy_id = request.query_params.get("pharmacyId")
        status_param = request.query_params.get("status")

        requests_qs = services.list_deletion_requests(
            pharmacy_id=pharmacy_id,
            status=status_param,
        )
        serializer = DeletionRequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateDeletionRequestInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        deletion_request = services.create_deletion_request(
            product_id=data["productId"],
            pharmacy_id=data["pharmacyId"],
            requested_by=str(request.user.id),
            reason=data.get("reason"),
        )

        out_serializer = DeletionRequestSerializer(deletion_request)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class DeletionRequestDetailView(APIView):
    """
    GET a single deletion request by id, POST to update status.
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

    def post(self, request, pk):
        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return Response(
                {"detail": "Invalid action. Use 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_value = "approved" if action == "approve" else "rejected"

        try:
            deletion_request = services.update_deletion_request_status(
                pk,
                reviewed_by=str(request.user.id),
                status=status_value,
            )
        except DeletionRequest.DoesNotExist:
            return Response(
                {"detail": "Deletion request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DeletionRequestSerializer(deletion_request)
        return Response(serializer.data)


