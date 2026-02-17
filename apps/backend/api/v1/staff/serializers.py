"""
Staff serializers. Output uses camelCase to match frontend contract.
"""
from rest_framework import serializers

from .models import Staff


class StaffListSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source="user_id", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Staff
        fields = [
            "id",
            "userId",
            "department",
            "position",
            "specialization",
            "bio",
            "phone",
            "isActive",
            "createdAt",
            "updatedAt",
        ]


class StaffDetailSerializer(StaffListSerializer):
    """Detailed staff view (same as list for now)."""
    pass


class StaffCreateInputSerializer(serializers.Serializer):
    userId = serializers.CharField(max_length=255)
    department = serializers.CharField(max_length=255)
    position = serializers.CharField(max_length=255)
    specialization = serializers.CharField(max_length=255, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    isActive = serializers.BooleanField(default=True, required=False)


class StaffUpdateInputSerializer(serializers.Serializer):
    department = serializers.CharField(max_length=255, required=False)
    position = serializers.CharField(max_length=255, required=False)
    specialization = serializers.CharField(max_length=255, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    isActive = serializers.BooleanField(required=False)
