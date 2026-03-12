"""
DeletionRequest serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import DeletionRequest


class DeletionRequestSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source="product_id")
    pharmacyId = serializers.CharField(source="pharmacy_id")
    requestedBy = serializers.CharField(source="requested_by")
    reviewedBy = serializers.CharField(source="reviewed_by", allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = DeletionRequest
        fields = [
            "id",
            "productId",
            "pharmacyId",
            "requestedBy",
            "reviewedBy",
            "status",
            "reason",
            "createdAt",
            "updatedAt",
        ]


class CreateDeletionRequestInputSerializer(serializers.Serializer):
    productId = serializers.CharField(max_length=255)
    pharmacyId = serializers.CharField(max_length=255)
    reason = serializers.CharField(required=False, allow_blank=True)


