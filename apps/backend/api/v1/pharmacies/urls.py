from django.urls import path

from .views import (
    MyPharmaciesView,
    PharmacyCreateView,
    PharmacyDetailView,
    PharmacyListView,
)

urlpatterns = [
    path("", PharmacyListView.as_view(), name="pharmacy-list"),
    path("create/", PharmacyCreateView.as_view(), name="pharmacy-create"),
    path("my-pharmacies/", MyPharmaciesView.as_view(), name="pharmacy-my"),
    path("<str:pk>/", PharmacyDetailView.as_view(), name="pharmacy-detail"),
]

