"""
Todo API views. List, get, create, update, delete.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Todo
from . import services
from .serializers import (
    TodoListSerializer,
    TodoCreateInputSerializer,
    TodoUpdateInputSerializer,
)


class TodoListCreateView(APIView):
    """GET list, POST create."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        todos = services.get_all_todos()
        serializer = TodoListSerializer(todos, many=True)
        return Response(serializer.data)

    def post(self, request):
        in_serializer = TodoCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        todo = services.create_todo(
            title=data["title"],
            completed=data.get("completed", False),
            author_id=request.user.pk,
        )
        out_serializer = TodoListSerializer(todo)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class TodoDetailView(APIView):
    """GET, PUT, DELETE by id."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            todo = services.get_todo_by_id(pk)
        except Todo.DoesNotExist:
            return Response(
                {"detail": f"Todo with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TodoListSerializer(todo)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            in_serializer = TodoUpdateInputSerializer(data=request.data, partial=True)
            in_serializer.is_valid(raise_exception=True)
            data = in_serializer.validated_data
            todo = services.update_todo(
                pk,
                title=data.get("title"),
                completed=data.get("completed"),
            )
        except Todo.DoesNotExist:
            return Response(
                {"detail": f"Todo with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        out_serializer = TodoListSerializer(todo)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            result = services.delete_todo(pk)
        except Todo.DoesNotExist:
            return Response(
                {"detail": f"Todo with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(result)

