from django.urls import path

from .views import AdminBrandDetailView, AdminBrandListView

urlpatterns = [
    path("", AdminBrandListView.as_view(), name="admin-brand-list"),
    path("<str:pk>/", AdminBrandDetailView.as_view(), name="admin-brand-detail"),
]
