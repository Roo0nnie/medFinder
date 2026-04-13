"""
V1 API URLconf. Health, example/todos, users, and staff.
"""
from django.urls import path, include

urlpatterns = [
    path("health/", include("api.v1.health.urls")),
    path("users/", include("api.v1.users.urls")),
    path("staff/", include("api.v1.staff.urls")),
    path("public/", include("api.v1.public.urls")),
    path("pharmacies/", include("api.v1.pharmacies.urls")),
    path("brands/", include("api.v1.brands.urls")),
    path("admin/brands/", include("api.v1.brands.admin_urls")),
    path("products/", include("api.v1.products.urls")),
    path("inventory/", include("api.v1.inventory.urls")),
    path("reviews/", include("api.v1.reviews.urls")),
    path("analytics/", include("api.v1.analytics.urls")),
    path("deletion-requests/", include("api.v1.deletion_requests.urls")),
    path("reservations/", include("api.v1.reservations.urls")),
]
