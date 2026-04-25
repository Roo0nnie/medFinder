"""
User API views. List, retrieve, update, delete.
Users must be created via Better Auth (auth.api.signUpEmail), not through this API.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.analytics.audit_helpers import audit_actor_from_request, safe_log_audit_event

from .models import User
from . import services
from .permissions import IsOwner, IsSelfOrAdmin
from .serializers import (
    UserListSerializer,
    UserMeLocationInputSerializer,
    UserUpdateInputSerializer,
)


class UserMeLocationView(APIView):
    """POST persist or DELETE clear the authenticated user's last-known map coordinates (opt-in)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        in_serializer = UserMeLocationInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        if not data.get("consent"):
            return Response(
                {"detail": "consent must be true to store location on the server."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = services.save_user_location(
                str(request.user.id),
                latitude=data["latitude"],
                longitude=data["longitude"],
                accuracy=data.get("accuracy"),
                consent=True,
            )
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserListSerializer(user).data, status=status.HTTP_200_OK)

    def delete(self, request):
        try:
            user = services.clear_user_location(str(request.user.id))
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserListSerializer(user).data, status=status.HTTP_200_OK)


class UserListView(APIView):
    """GET list of users."""

    # Only authenticated admin/owner roles can list users for staff management.
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        users = services.get_all_users()
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailView(APIView):
    """GET details, PUT update, DELETE by id (authenticated, with role-based permissions)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = services.get_user_by_id(pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user can access this user's data
        if not self._can_access_user(request.user, user):
            return Response(
                {"detail": "You do not have permission to access this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserListSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            user = services.get_user_by_id(pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user can modify this user's data
        if not self._can_modify_user(request.user, user):
            return Response(
                {"detail": "You do not have permission to modify this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        in_serializer = UserUpdateInputSerializer(data=request.data, partial=True)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        user = services.update_user(
            pk,
            first_name=data.get("firstName"),
            last_name=data.get("lastName"),
            middle_name=data.get("middleName"),
            role=data.get("role"),
            email=data.get("email"),
            profile_image_url=data.get("profileImageUrl"),
            phone=data.get("phone"),
        )
        actor_uid, actor_role = audit_actor_from_request(request)
        # No tenant owner scope for user objects in general; store actor user id as owner_id so it
        # appears in platform-wide admin audit views but not in owner-scoped audit pages.
        safe_log_audit_event(
            owner_id=str(actor_uid or getattr(request.user, "id", "") or ""),
            actor_user_id=actor_uid,
            actor_role=actor_role or str(getattr(request.user, "role", "") or ""),
            action="UPDATE",
            resource_type="User",
            resource_id=str(pk),
            details="",
        )
        out_serializer = UserListSerializer(user)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            user = services.get_user_by_id(pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only admin/owner can delete users
        if request.user.role not in ("admin", "owner"):
            return Response(
                {"detail": "You do not have permission to delete users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        result = services.delete_user(pk)
        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=str(actor_uid or getattr(request.user, "id", "") or ""),
            actor_user_id=actor_uid,
            actor_role=actor_role or str(getattr(request.user, "role", "") or ""),
            action="DELETE",
            resource_type="User",
            resource_id=str(pk),
            details="",
        )
        return Response(result)

    @staticmethod
    def _can_access_user(requester, target_user):
        """Admin can access any user, others can only access themselves."""
        if requester.role == "admin":
            return True
        return str(requester.id) == str(target_user.id)

    @staticmethod
    def _can_modify_user(requester, target_user):
        """Admin/Owner can modify any user, others can only modify themselves."""
        if requester.role in ("admin", "owner"):
            return True
        return str(requester.id) == str(target_user.id)
