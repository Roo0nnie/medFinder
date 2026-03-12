"""
Reservation serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import ProductReservation


class ProductReservationSerializer(serializers.ModelSerializer):
    customerId = serializers.CharField(source="customer_id")
    inventoryId = serializers.CharField(source="inventory_id")
    expiresAt = serializers.DateTimeField(source="expires_at", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ProductReservation
        fields = [
            "id",
            "customerId",
            "inventoryId",
            "quantity",
            "status",
            "expiresAt",
            "createdAt",
            "updatedAt",
        ]


class CreateReservationInputSerializer(serializers.Serializer):
    inventoryId = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(min_value=1)


class UpdateReservationInputSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, required=False)
    status = serializers.CharField(max_length=50, required=False)


