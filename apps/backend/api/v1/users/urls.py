"""
User URLs. /api/v1/users/ and /api/v1/users/<id>/
"""
from django.urls import path

from .views import UserListCreateView, UserDetailView

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<str:pk>/", UserDetailView.as_view(), name="user-detail"),
]
