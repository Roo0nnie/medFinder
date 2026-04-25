from django.urls import path

from .views import (
    AdminAnalyticsDashboardView,
    AdminAnalyticsReportsView,
    AdminAuditsListView,
    AdminCategoriesListView,
    AdminPharmaciesListView,
    AdminProductsListView,
    AdminReviewsListView,
    AdminUsersListView,
)

urlpatterns = [
    path("users/", AdminUsersListView.as_view(), name="admin-users"),
    path("pharmacies/", AdminPharmaciesListView.as_view(), name="admin-pharmacies"),
    path("products/", AdminProductsListView.as_view(), name="admin-products"),
    path("categories/", AdminCategoriesListView.as_view(), name="admin-categories"),
    path("reviews/", AdminReviewsListView.as_view(), name="admin-reviews"),
    path("audits/", AdminAuditsListView.as_view(), name="admin-audits"),
    path(
        "analytics/dashboard/",
        AdminAnalyticsDashboardView.as_view(),
        name="admin-analytics-dashboard",
    ),
    path(
        "analytics/reports/",
        AdminAnalyticsReportsView.as_view(),
        name="admin-analytics-reports",
    ),
]

