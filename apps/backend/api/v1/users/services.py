"""
User CRUD business logic. Operates on the shared users table.
"""
import uuid

from .models import User


def get_all_users():
    return User.objects.all().order_by("-updated_at")


def get_user_by_id(pk):
    return User.objects.get(pk=pk)  # raises User.DoesNotExist -> 404 in view


def create_user(*, email, password=None, first_name=None, last_name="", middle_name=None, role="customer"):
    """Create user row. Password is not stored here (lives in accounts table via better-auth). Use sign-up or seed for password."""
    from django.utils import timezone
    user_id = str(uuid.uuid4())
    now = timezone.now()
    return User.objects.create(
        id=user_id,
        email=email,
        email_verified=False,
        first_name=first_name or "",
        last_name=last_name,
        middle_name=middle_name or "",
        role=role,
        created_at=now,
        updated_at=now,
    )


def update_user(pk, *, first_name=None, last_name=None, middle_name=None, role=None, email=None):
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
    user.updated_at = timezone.now()
    update_fields.append("updated_at")
    user.save(update_fields=update_fields)
    return user


def delete_user(pk):
    user = User.objects.get(pk=pk)
    user.delete()
    return {"success": True, "id": str(pk)}
