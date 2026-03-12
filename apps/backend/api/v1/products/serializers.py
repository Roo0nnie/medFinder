"""
Product serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import MedicalProduct, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    parentCategoryId = serializers.CharField(source="parent_category_id", allow_null=True)

    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "name",
            "description",
            "parentCategoryId",
        ]


class MedicalProductSerializer(serializers.ModelSerializer):
    genericName = serializers.CharField(source="generic_name", allow_null=True)
    brandName = serializers.CharField(source="brand_name", allow_null=True)
    manufacturer = serializers.CharField(allow_null=True)
    categoryId = serializers.CharField(source="category_id")
    dosageForm = serializers.CharField(source="dosage_form", allow_null=True)
    imageUrl = serializers.CharField(source="image_url", allow_null=True)
    requiresPrescription = serializers.BooleanField(source="requires_prescription")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = MedicalProduct
        fields = [
            "id",
            "name",
            "genericName",
            "brandName",
            "description",
            "manufacturer",
            "categoryId",
            "dosageForm",
            "strength",
            "unit",
            "requiresPrescription",
            "imageUrl",
            "createdAt",
            "updatedAt",
        ]


