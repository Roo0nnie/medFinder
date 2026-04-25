"""
User URLs. /api/v1/users/ and /api/v1/users/<id>/
"""
from django.urls import path

from .views import UserDetailView, UserListView, UserMeLocationView

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("me/location/", UserMeLocationView.as_view(), name="user-me-location"),
    path("<str:pk>/", UserDetailView.as_view(), name="user-detail"),
]
