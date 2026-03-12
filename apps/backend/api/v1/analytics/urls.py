from django.urls import path

from .views import (
    MonthlySalesView,
    OwnerStatsView,
    PlatformStatsView,
    StaffStatsView,
    TopProductsView,
)


urlpatterns = [
    path("platform-stats/", PlatformStatsView.as_view(), name="analytics-platform-stats"),
    path("owner-stats/", OwnerStatsView.as_view(), name="analytics-owner-stats"),
    path("staff-stats/", StaffStatsView.as_view(), name="analytics-staff-stats"),
    path("monthly-sales/", MonthlySalesView.as_view(), name="analytics-monthly-sales"),
    path("top-products/", TopProductsView.as_view(), name="analytics-top-products"),
]


