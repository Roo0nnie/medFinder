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
    profileImageUrl = serializers.CharField(source="profile_image_url", read_only=True)
    locationAccuracy = serializers.FloatField(source="location_accuracy", read_only=True, allow_null=True)
    locationUpdatedAt = serializers.DateTimeField(source="location_updated_at", read_only=True, allow_null=True)
    locationConsentAt = serializers.DateTimeField(source="location_consent_at", read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "emailVerified",
            "image",
            "profileImageUrl",
            "firstName",
            "lastName",
            "middleName",
            "phone",
            "latitude",
            "longitude",
            "locationAccuracy",
            "locationUpdatedAt",
            "locationConsentAt",
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
    profileImageUrl = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, allow_null=True)


class UserMeLocationInputSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)
    accuracy = serializers.FloatField(required=False, allow_null=True, min_value=0.0)
    consent = serializers.BooleanField()
