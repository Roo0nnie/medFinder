"""
Brand serializers (camelCase output).
"""
from rest_framework import serializers

from .models import Brand


class BrandSerializer(serializers.ModelSerializer):
    normalizedName = serializers.CharField(source="normalized_name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Brand
        fields = ["id", "name", "normalizedName", "createdAt", "updatedAt"]


class BrandCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)


class BrandMineUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
