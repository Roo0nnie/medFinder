from django.urls import path

from .views import DeletionRequestDetailView, DeletionRequestListCreateView


urlpatterns = [
    path("", DeletionRequestListCreateView.as_view(), name="deletion-request-list-create"),
    path("<str:pk>/", DeletionRequestDetailView.as_view(), name="deletion-request-detail"),
]


