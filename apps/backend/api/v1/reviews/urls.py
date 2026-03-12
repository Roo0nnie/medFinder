from django.urls import path

from .views import (
    PharmacyReviewDetailView,
    PharmacyReviewListCreateView,
    ProductReviewDetailView,
    ProductReviewListCreateView,
)


urlpatterns = [
    path("pharmacies/", PharmacyReviewListCreateView.as_view(), name="pharmacy-review-list-create"),
    path("pharmacies/<str:pk>/", PharmacyReviewDetailView.as_view(), name="pharmacy-review-detail"),
    path("products/", ProductReviewListCreateView.as_view(), name="product-review-list-create"),
    path("products/<str:pk>/", ProductReviewDetailView.as_view(), name="product-review-detail"),
]


