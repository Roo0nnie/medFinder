"""
Inventory serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from api.v1.products.models import MedicalProductVariant

from .models import PharmacyInventory


class PharmacyInventorySerializer(serializers.ModelSerializer):
    pharmacyId = serializers.CharField(source="pharmacy_id")
    productId = serializers.CharField(source="product_id")
    variantId = serializers.CharField(source="variant_id", allow_null=True)
    variantLabel = serializers.SerializerMethodField()

    def get_variantLabel(self, obj):
        if not getattr(obj, "variant_id", None):
            return None
        try:
            v = MedicalProductVariant.objects.get(pk=obj.variant_id)
            return v.label
        except MedicalProductVariant.DoesNotExist:
            return None

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
            "variantId",
            "variantLabel",
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


class PharmacyInventoryCreateSerializer(serializers.Serializer):
    pharmacyId = serializers.CharField(max_length=255)
    productId = serializers.CharField(max_length=255)
    variantId = serializers.CharField(max_length=255, required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=0)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discountPrice = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    expiryDate = serializers.DateTimeField(required=False, allow_null=True)
    batchNumber = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    isAvailable = serializers.BooleanField(required=False)
    lastRestocked = serializers.DateTimeField(required=False, allow_null=True)


class PharmacyInventoryUpdateSerializer(serializers.Serializer):
    variantId = serializers.CharField(max_length=255, required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=0, required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    discountPrice = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    expiryDate = serializers.DateTimeField(required=False, allow_null=True)
    batchNumber = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    isAvailable = serializers.BooleanField(required=False)
    lastRestocked = serializers.DateTimeField(required=False, allow_null=True)

