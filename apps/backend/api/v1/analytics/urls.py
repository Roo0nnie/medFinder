from django.urls import path

from .views import (
    AuditEventsListView,
    SessionAuditView,
    MonthlySalesView,
    OwnerBottomProductsByViewsView,
    OwnerHighDemandOutOfStockView,
    OwnerNoResultSearchesView,
    OwnerReviewRatingsView,
    OwnerSearchPeakHoursView,
    OwnerSearchTrendsView,
    OwnerStatsView,
    OwnerTopCategoriesView,
    OwnerTopProductsBySearchSelectionsView,
    OwnerTopProductsByViewsView,
    OwnerTopStaffByAuditActionsView,
    OwnerTopSearchesView,
    OwnerTrendingProductsByViewsView,
    PlatformStatsView,
    ProductEngagementCreateView,
    ProductSearchSelectionCreateView,
    StaffDashboardView,
    StaffStatsView,
    TopProductsView,
)


urlpatterns = [
    path("platform-stats/", PlatformStatsView.as_view(), name="analytics-platform-stats"),
    path("owner-stats/", OwnerStatsView.as_view(), name="analytics-owner-stats"),
    path(
        "owner-review-ratings/",
        OwnerReviewRatingsView.as_view(),
        name="analytics-owner-review-ratings",
    ),
    path("staff-dashboard/", StaffDashboardView.as_view(), name="analytics-staff-dashboard"),
    path("staff-stats/", StaffStatsView.as_view(), name="analytics-staff-stats"),
    path("monthly-sales/", MonthlySalesView.as_view(), name="analytics-monthly-sales"),
    path("top-products/", TopProductsView.as_view(), name="analytics-top-products"),
    path(
        "owner-top-categories/",
        OwnerTopCategoriesView.as_view(),
        name="analytics-owner-top-categories",
    ),
    path("owner-top-searches/", OwnerTopSearchesView.as_view(), name="analytics-owner-top-searches"),
    path(
        "owner-search-trends/",
        OwnerSearchTrendsView.as_view(),
        name="analytics-owner-search-trends",
    ),
    path(
        "owner-search-peak-hours/",
        OwnerSearchPeakHoursView.as_view(),
        name="analytics-owner-search-peak-hours",
    ),
    path(
        "owner-no-result-searches/",
        OwnerNoResultSearchesView.as_view(),
        name="analytics-owner-no-result-searches",
    ),
    path(
        "owner-top-products-by-views/",
        OwnerTopProductsByViewsView.as_view(),
        name="analytics-owner-top-products-by-views",
    ),
    path(
        "owner-bottom-products-by-views/",
        OwnerBottomProductsByViewsView.as_view(),
        name="analytics-owner-bottom-products-by-views",
    ),
    path(
        "owner-trending-products-by-views/",
        OwnerTrendingProductsByViewsView.as_view(),
        name="analytics-owner-trending-products-by-views",
    ),
    path(
        "owner-high-demand-out-of-stock/",
        OwnerHighDemandOutOfStockView.as_view(),
        name="analytics-owner-high-demand-out-of-stock",
    ),
    path(
        "product-engagement/",
        ProductEngagementCreateView.as_view(),
        name="analytics-product-engagement",
    ),
    path("audit-events/", AuditEventsListView.as_view(), name="analytics-audit-events"),
    path("session-audit/", SessionAuditView.as_view(), name="analytics-session-audit"),
    path(
        "product-search-selection/",
        ProductSearchSelectionCreateView.as_view(),
        name="analytics-product-search-selection",
    ),
    path(
        "owner-top-products-by-search-selections/",
        OwnerTopProductsBySearchSelectionsView.as_view(),
        name="analytics-owner-top-products-by-search-selections",
    ),
    path(
        "owner-top-staff-by-audit-actions/",
        OwnerTopStaffByAuditActionsView.as_view(),
        name="analytics-owner-top-staff-by-audit-actions",
    ),
]


