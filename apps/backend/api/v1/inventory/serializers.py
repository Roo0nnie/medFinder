"""
Inventory serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import PharmacyInventory


class PharmacyInventorySerializer(serializers.ModelSerializer):
    pharmacyId = serializers.CharField(source="pharmacy_id")
    productId = serializers.CharField(source="product_id")
    discountPrice = serializers.DecimalField(
        source="discount_price",
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    expiryDate = serializers.DateTimeField(source="expiry_date", required=False, allow_null=True)
    batchNumber = serializers.CharField(source="batch_number", required=False, allow_blank=True, allow_null=True)
    isAvailable = serializers.BooleanField(source="is_available")
    lastRestocked = serializers.DateTimeField(source="last_restocked", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = PharmacyInventory
        fields = [
            "id",
            "pharmacyId",
            "productId",
            "quantity",
            "price",
            "discountPrice",
            "expiryDate",
            "batchNumber",
            "isAvailable",
            "lastRestocked",
            "createdAt",
            "updatedAt",
        ]


