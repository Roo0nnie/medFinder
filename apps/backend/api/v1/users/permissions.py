"""
User CRUD permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only admin users can access."""
    message = "Admin access required"

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsOwner(BasePermission):
    """Only owner users can access."""
    message = "Owner access required"

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "owner")
        )


class IsAdminOrReadOnly(BasePermission):
    """Admin can edit, anyone can read."""
    message = "Admin access required for modifications"

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsOwnerOrReadOnly(BasePermission):
    """Owner/Admin can edit, anyone can read."""
    message = "Owner or admin access required for modifications"

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "owner")
        )


class IsSelfOrAdmin(BasePermission):
    """Admin can do anything, users can only access their own data."""
    message = "You can only access your own data"

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        return obj.id == str(request.user.id)
