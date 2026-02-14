"""
User API views. List, create, retrieve, update, delete.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from . import services
from .serializers import (
    UserListSerializer,
    UserCreateInputSerializer,
    UserUpdateInputSerializer,
)


class UserListCreateView(APIView):
    """GET list, POST create."""

    permission_classes = [AllowAny]

    def get(self, request):
        users = services.get_all_users()
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        in_serializer = UserCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        user = services.create_user(
            email=data["email"],
            password=data.get("password"),
            first_name=data.get("firstName") or "",
            last_name=data.get("lastName", ""),
            middle_name=data.get("middleName"),
            role=data.get("role", "customer"),
        )
        out_serializer = UserListSerializer(user)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """GET, PUT, DELETE by id."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            user = services.get_user_by_id(pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UserListSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
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
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        out_serializer = UserListSerializer(user)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            result = services.delete_user(pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(result)

