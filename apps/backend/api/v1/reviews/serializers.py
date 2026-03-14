"""
Review serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from api.v1.users.models import User

from .models import PharmacyReview, ProductReview


class PharmacyReviewSerializer(serializers.ModelSerializer):
    pharmacyId = serializers.CharField(source="pharmacy_id")
    pharmacyName = serializers.SerializerMethodField()
    userId = serializers.CharField(source="user_id")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = PharmacyReview
        fields = [
            "id",
            "pharmacyId",
            "pharmacyName",
            "userId",
            "rating",
            "comment",
            "createdAt",
            "updatedAt",
            "user",
        ]

    def get_pharmacyName(self, obj: PharmacyReview):
        pharmacies_by_id = self.context.get("pharmacies_by_id") or {}
        pharmacy = pharmacies_by_id.get(str(obj.pharmacy_id))
        return pharmacy.name if pharmacy else None

    def get_user(self, obj: PharmacyReview):
        users_by_id: dict[str, User] | None = self.context.get("users_by_id")
        if not users_by_id:
            return None

        user = users_by_id.get(str(obj.user_id))
        if not user:
            return None

        return {
            "id": str(user.id),
            "firstName": user.first_name,
            "lastName": user.last_name,
            "image": user.image,
        }


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


