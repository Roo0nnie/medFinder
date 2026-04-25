"""
User CRUD business logic. Operates on the shared users table.

IMPORTANT: User creation must happen via Better Auth (e.g., auth.api.signUpEmail).
Direct table writes to create users will not populate the accounts table with passwords,
making those users unable to log in. This service only handles read/update/delete operations.
"""
from typing import Optional

from .models import User


def get_all_users():
    return User.objects.all().order_by("-updated_at")


def get_user_by_id(pk):
    return User.objects.get(pk=pk)  # raises User.DoesNotExist -> 404 in view


def update_user(
    pk,
    *,
    first_name=None,
    last_name=None,
    middle_name=None,
    role=None,
    email=None,
    profile_image_url=None,
    phone=None,
):
    from django.utils import timezone
    user = User.objects.get(pk=pk)
    update_fields = []
    if first_name is not None:
        user.first_name = first_name
        update_fields.append("first_name")
    if last_name is not None:
        user.last_name = last_name
        update_fields.append("last_name")
    if middle_name is not None:
        user.middle_name = middle_name
        update_fields.append("middle_name")
    if role is not None:
        user.role = role
        update_fields.append("role")
    if email is not None:
        user.email = email
        update_fields.append("email")
    if profile_image_url is not None:
        user.profile_image_url = profile_image_url
        update_fields.append("profile_image_url")
        # Mirror into Better Auth's `image` field so sessions/clients that only read `image` still get the latest photo.
        user.image = profile_image_url
        update_fields.append("image")
    if phone is not None:
        user.phone = phone or None
        update_fields.append("phone")
    user.updated_at = timezone.now()
    update_fields.append("updated_at")
    user.save(update_fields=update_fields)
    return user


def delete_user(pk):
    user = User.objects.get(pk=pk)
    user.delete()
    return {"success": True, "id": str(pk)}


def save_user_location(
    user_id: str,
    *,
    latitude: float,
    longitude: float,
    accuracy: Optional[float] = None,
    consent: bool = False,
):
    """
    Persist last-known coordinates on the user row. Only call when consent is True.
    """
    from django.utils import timezone

    if not consent:
        raise ValueError("consent must be true to persist location")

    user = User.objects.get(pk=user_id)
    user.latitude = latitude
    user.longitude = longitude
    user.location_accuracy = accuracy
    now = timezone.now()
    user.location_updated_at = now
    if user.location_consent_at is None:
        user.location_consent_at = now
    user.updated_at = now
    user.save(
        update_fields=[
            "latitude",
            "longitude",
            "location_accuracy",
            "location_updated_at",
            "location_consent_at",
            "updated_at",
        ]
    )
    return user


def clear_user_location(user_id: str):
    from django.utils import timezone

    user = User.objects.get(pk=user_id)
    user.latitude = None
    user.longitude = None
    user.location_accuracy = None
    user.location_updated_at = None
    user.location_consent_at = None
    user.updated_at = timezone.now()
    user.save(
        update_fields=[
            "latitude",
            "longitude",
            "location_accuracy",
            "location_updated_at",
            "location_consent_at",
            "updated_at",
        ]
    )
    return user
