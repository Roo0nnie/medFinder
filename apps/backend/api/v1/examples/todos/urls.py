"""
Todo URLs. /api/v1/example/todos/ and /api/v1/example/todos/<id>/
"""
from django.urls import path

from .views import TodoListCreateView, TodoDetailView

urlpatterns = [
    path("todos/", TodoListCreateView.as_view(), name="todo-list-create"),
    path("todos/<int:pk>/", TodoDetailView.as_view(), name="todo-detail"),
]
