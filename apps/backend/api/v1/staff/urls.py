"""
Staff URLs. /api/v1/staff/ for list/search and create, /api/v1/staff/<id>/ for detail/update/delete
"""
from django.urls import path

from .views import StaffListSearchView, StaffCreateView, StaffDetailView

urlpatterns = [
    path("", StaffListSearchView.as_view(), name="staff-list-search"),
    path("create/", StaffCreateView.as_view(), name="staff-create"),
    path("<str:pk>/", StaffDetailView.as_view(), name="staff-detail"),
]
