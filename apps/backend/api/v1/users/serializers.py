"""
User serializers. Output uses camelCase to match frontend contract.
"""
from rest_framework import serializers

from .models import User

ROLE_CHOICES = ["admin", "owner", "staff", "customer"]


class UserListSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    middleName = serializers.CharField(source="middle_name", read_only=True)
    emailVerified = serializers.BooleanField(source="email_verified", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "emailVerified",
            "image",
            "firstName",
            "lastName",
            "middleName",
            "role",
            "createdAt",
            "updatedAt",
        ]


class UserUpdateInputSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    lastName = serializers.CharField(max_length=255, required=False)
    middleName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)
    email = serializers.EmailField(required=False)
