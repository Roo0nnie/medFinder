"""
Staff CRUD and search business logic.
"""
import uuid

from django.db.models import Q
from django.utils import timezone

from .models import Staff


def get_all_staff(is_active=True, search_query=None, limit=None, offset=None):
    """Get all staff, optionally filtered by active status and search query."""
    queryset = Staff.objects.all()

    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    if search_query:
        search_query = search_query.strip()
        queryset = queryset.filter(
            Q(department__icontains=search_query)
            | Q(position__icontains=search_query)
            | Q(specialization__icontains=search_query)
            | Q(bio__icontains=search_query)
        )

    queryset = queryset.order_by("-updated_at")

    if offset is not None:
        queryset = queryset[offset:]
    if limit is not None:
        queryset = queryset[:limit]

    return queryset


def get_staff_by_id(staff_id):
    """Get a specific staff member by ID."""
    return Staff.objects.get(pk=staff_id)  # raises Staff.DoesNotExist -> 404 in view


def get_staff_by_user_id(user_id):
    """Get staff profile for a user ID."""
    return Staff.objects.get(user_id=user_id)  # raises Staff.DoesNotExist -> 404 in view


def create_staff(
    *,
    user_id,
    department,
    position,
    specialization=None,
    bio=None,
    phone=None,
    is_active=True
):
    """Create a new staff profile."""
    staff_id = str(uuid.uuid4())
    now = timezone.now()
    return Staff.objects.create(
        id=staff_id,
        user_id=user_id,
        department=department,
        position=position,
        specialization=specialization or "",
        bio=bio or "",
        phone=phone or "",
        is_active=is_active,
        created_at=now,
        updated_at=now,
    )


def update_staff(
    staff_id,
    *,
    department=None,
    position=None,
    specialization=None,
    bio=None,
    phone=None,
    is_active=None
):
    """Update a staff profile."""
    staff = Staff.objects.get(pk=staff_id)
    update_fields = []

    if department is not None:
        staff.department = department
        update_fields.append("department")
    if position is not None:
        staff.position = position
        update_fields.append("position")
    if specialization is not None:
        staff.specialization = specialization
        update_fields.append("specialization")
    if bio is not None:
        staff.bio = bio
        update_fields.append("bio")
    if phone is not None:
        staff.phone = phone
        update_fields.append("phone")
    if is_active is not None:
        staff.is_active = is_active
        update_fields.append("is_active")

    staff.updated_at = timezone.now()
    update_fields.append("updated_at")

    staff.save(update_fields=update_fields)
    return staff


def delete_staff(staff_id):
    """Delete a staff profile."""
    staff = Staff.objects.get(pk=staff_id)
    staff.delete()
    return {"success": True, "id": str(staff_id)}
