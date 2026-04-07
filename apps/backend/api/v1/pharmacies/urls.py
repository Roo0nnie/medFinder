from django.urls import path

from .views import (
    PharmacyCertificateReviewView,
    PharmacyCertificateUploadView,
    MyPharmaciesView,
    PharmacyCreateView,
    PharmacyDetailView,
    PharmacyImageUploadView,
    PharmacyListView,
)

urlpatterns = [
    path("", PharmacyListView.as_view(), name="pharmacy-list"),
    path("create/", PharmacyCreateView.as_view(), name="pharmacy-create"),
    path("my-pharmacies/", MyPharmaciesView.as_view(), name="pharmacy-my"),
    path("<str:pk>/upload-image/", PharmacyImageUploadView.as_view(), name="pharmacy-upload-image"),
    path("<str:pk>/certificate/", PharmacyCertificateUploadView.as_view(), name="pharmacy-certificate-upload"),
    path("<str:pk>/certificate/review/", PharmacyCertificateReviewView.as_view(), name="pharmacy-certificate-review"),
    path("<str:pk>/", PharmacyDetailView.as_view(), name="pharmacy-detail"),
]

