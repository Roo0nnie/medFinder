"""
Pharmacy serializers. Output uses camelCase to match frontend contract.
"""
from rest_framework import serializers

from .models import Pharmacy


class PharmacyListSerializer(serializers.ModelSerializer):
    ownerId = serializers.CharField(source="owner_id", read_only=True)
    zipCode = serializers.CharField(source="zip_code", read_only=True)
    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)
    operatingHours = serializers.CharField(source="operating_hours", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    logo = serializers.CharField(read_only=True)
    googleMapEmbed = serializers.CharField(source="google_map_embed", read_only=True)
    socialLinks = serializers.CharField(source="social_links", read_only=True)
    distance = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = Pharmacy
        fields = [
            "id",
            "ownerId",
            "name",
            "description",
            "address",
            "city",
            "state",
            "zipCode",
            "country",
            "latitude",
            "longitude",
            "phone",
            "email",
            "website",
            "operatingHours",
            "isActive",
            "logo",
            "googleMapEmbed",
            "socialLinks",
            "createdAt",
            "updatedAt",
            "distance",
        ]


class PharmacyDetailSerializer(PharmacyListSerializer):
    """Detailed pharmacy view (currently same as list)."""

    pass


class PharmacyCreateInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField()
    city = serializers.CharField(max_length=255)
    state = serializers.CharField(max_length=255)
    zipCode = serializers.CharField(max_length=50)
    country = serializers.CharField(max_length=100, required=False)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    operatingHours = serializers.CharField(required=False, allow_blank=True)
    logo = serializers.CharField(required=False, allow_blank=True)
    googleMapEmbed = serializers.CharField(required=False, allow_blank=True)
    socialLinks = serializers.CharField(required=False, allow_blank=True)


class PharmacyUpdateInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False)
    city = serializers.CharField(max_length=255, required=False)
    state = serializers.CharField(max_length=255, required=False)
    zipCode = serializers.CharField(max_length=50, required=False)
    country = serializers.CharField(max_length=100, required=False)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    operatingHours = serializers.CharField(required=False, allow_blank=True)
    isActive = serializers.BooleanField(required=False)
    logo = serializers.CharField(required=False, allow_blank=True)
    googleMapEmbed = serializers.CharField(required=False, allow_blank=True)
    socialLinks = serializers.CharField(required=False, allow_blank=True)

