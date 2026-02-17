"""
User URLs. /api/v1/users/ and /api/v1/users/<id>/
"""
from django.urls import path

from .views import UserListView, UserDetailView

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("<str:pk>/", UserDetailView.as_view(), name="user-detail"),
]
