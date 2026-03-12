"""
Review serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import PharmacyReview, ProductReview


class PharmacyReviewSerializer(serializers.ModelSerializer):
    pharmacyId = serializers.CharField(source="pharmacy_id")
    userId = serializers.CharField(source="user_id")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = PharmacyReview
        fields = [
            "id",
            "pharmacyId",
            "userId",
            "rating",
            "comment",
            "createdAt",
            "updatedAt",
        ]


class ProductReviewSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source="product_id")
    userId = serializers.CharField(source="user_id")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "productId",
            "userId",
            "rating",
            "comment",
            "createdAt",
            "updatedAt",
        ]


class CreatePharmacyReviewInputSerializer(serializers.Serializer):
    pharmacyId = serializers.CharField(max_length=255)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class CreateProductReviewInputSerializer(serializers.Serializer):
    productId = serializers.CharField(max_length=255)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


