"""
Inventory API views.
Currently read-only for dashboard analytics.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import PharmacyInventory
from .serializers import PharmacyInventorySerializer


class InventoryListView(APIView):
    """
    GET list/search inventory records.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        pharmacy_id = request.query_params.get("pharmacyId")
        product_id = request.query_params.get("productId")
        is_available_param = request.query_params.get("isAvailable")

        is_available = None
        if is_available_param is not None:
            is_available = is_available_param.lower() != "false"

        inventory = services.list_inventory(
            pharmacy_id=pharmacy_id,
            product_id=product_id,
            is_available=is_available,
        )
        serializer = PharmacyInventorySerializer(inventory, many=True)
        return Response(serializer.data)


class InventoryDetailView(APIView):
    """
    GET single inventory record by id.
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            record = services.get_inventory_by_id(pk)
        except PharmacyInventory.DoesNotExist:
            return Response(
                {"detail": "Inventory not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PharmacyInventorySerializer(record)
        return Response(serializer.data)


