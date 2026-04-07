"""
Product serializers. Output uses camelCase to match frontend contracts.
"""
from rest_framework import serializers

from .models import MedicalProduct, MedicalProductVariant, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    ownerId = serializers.CharField(source="owner_id")
    parentCategoryId = serializers.CharField(source="parent_category_id", allow_null=True)

    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "ownerId",
            "name",
            "description",
            "parentCategoryId",
        ]


class ProductCategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    parentCategoryId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    ownerId = serializers.CharField(max_length=255, required=False)  # default from request user when owner


class ProductCategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    parentCategoryId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)


class MedicalProductSerializer(serializers.ModelSerializer):
    pharmacyId = serializers.CharField(source="pharmacy_id", allow_null=True)
    genericName = serializers.CharField(source="generic_name", allow_null=True)
    brandId = serializers.CharField(source="brand_id", allow_null=True, required=False)
    brandName = serializers.CharField(source="brand_name", allow_null=True)
    manufacturer = serializers.CharField(allow_null=True)
    categoryId = serializers.CharField(source="category_id")
    dosageForm = serializers.CharField(source="dosage_form", allow_null=True)
    imageUrl = serializers.CharField(source="image_url", allow_null=True)
    requiresPrescription = serializers.BooleanField(source="requires_prescription")
    lowStockThreshold = serializers.IntegerField(source="low_stock_threshold", allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = MedicalProduct
        fields = [
            "id",
            "pharmacyId",
            "name",
            "genericName",
            "brandId",
            "brandName",
            "description",
            "manufacturer",
            "categoryId",
            "dosageForm",
            "strength",
            "unit",
            "requiresPrescription",
            "lowStockThreshold",
            "imageUrl",
            "supplier",
            "createdAt",
            "updatedAt",
        ]


class MedicalProductVariantSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source="product_id", read_only=True)
    sortOrder = serializers.IntegerField(source="sort_order", required=False, default=0)

    class Meta:
        model = MedicalProductVariant
        fields = ["id", "productId", "label", "sortOrder"]
        read_only_fields = ["id", "productId"]


class ProductVariantCreateSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=255)
    sortOrder = serializers.IntegerField(required=False, default=0)


class ProductVariantUpdateSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=255, required=False)
    sortOrder = serializers.IntegerField(required=False)


class ProductAvailabilityItemSerializer(serializers.Serializer):
    """One pharmacy's stock/price for a product. Used in product detail for catalog."""

    pharmacyId = serializers.CharField()
    pharmacyName = serializers.CharField()
    address = serializers.CharField()
    city = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discountPrice = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    quantity = serializers.IntegerField()
    isAvailable = serializers.BooleanField()


class MedicalProductCreateSerializer(serializers.Serializer):
    pharmacyId = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    genericName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    brandId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    brandName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    manufacturer = serializers.CharField(max_length=255, required=False, allow_blank=True)
    categoryId = serializers.CharField(max_length=255)
    dosageForm = serializers.CharField(max_length=255, required=False, allow_blank=True)
    strength = serializers.CharField(max_length=255, required=False, allow_blank=True)
    unit = serializers.CharField(max_length=50)
    requiresPrescription = serializers.BooleanField(required=False)
    imageUrl = serializers.CharField(required=False, allow_blank=True)
    supplier = serializers.CharField(max_length=255, required=False, allow_blank=True)
    lowStockThreshold = serializers.IntegerField(required=False, allow_null=True)
    # Pharmacy inventory fields (create row in pharmacy_inventory for this product)
    quantity = serializers.IntegerField(min_value=0, required=False, default=0)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    discountPrice = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    expiryDate = serializers.DateTimeField(required=False, allow_null=True)
    batchNumber = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    isAvailable = serializers.BooleanField(required=False, default=True)


class MedicalProductUpdateSerializer(serializers.Serializer):
    pharmacyId = serializers.CharField(max_length=255, required=False, allow_null=True)
    name = serializers.CharField(max_length=255, required=False)
    genericName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    brandId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    brandName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    manufacturer = serializers.CharField(max_length=255, required=False, allow_blank=True)
    categoryId = serializers.CharField(max_length=255, required=False)
    dosageForm = serializers.CharField(max_length=255, required=False, allow_blank=True)
    strength = serializers.CharField(max_length=255, required=False, allow_blank=True)
    unit = serializers.CharField(max_length=50, required=False)
    requiresPrescription = serializers.BooleanField(required=False)
    imageUrl = serializers.CharField(required=False, allow_blank=True)
    supplier = serializers.CharField(max_length=255, required=False, allow_blank=True)
    lowStockThreshold = serializers.IntegerField(required=False, allow_null=True)
    # Pharmacy inventory fields (update or create pharmacy_inventory row)
    variantId = serializers.CharField(max_length=255, required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=0, required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    discountPrice = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    expiryDate = serializers.DateTimeField(required=False, allow_null=True)
    batchNumber = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    isAvailable = serializers.BooleanField(required=False)

