"""
Admin API views (platform-wide tables + analytics).
"""

from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.users.permissions import IsAdmin

from . import services


class _AdminOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminUsersListView(_AdminOnlyView):
    """GET /v1/admin/users/"""

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        rows = services.list_admin_users(search=search)
        return Response(rows)


class AdminPharmaciesListView(_AdminOnlyView):
    """GET /v1/admin/pharmacies/"""

    def get(self, request):
        status = (request.query_params.get("certificateStatus") or "").strip() or None
        search = (request.query_params.get("search") or "").strip()
        rows = services.list_admin_pharmacies(status=status, search=search)
        return Response(rows)


class AdminProductsListView(_AdminOnlyView):
    """GET /v1/admin/products/"""

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        rows = services.list_admin_products(search=search)
        return Response(rows)


class AdminCategoriesListView(_AdminOnlyView):
    """GET /v1/admin/categories/"""

    def get(self, request):
        owner_id = (request.query_params.get("ownerId") or "").strip() or None
        rx_param = request.query_params.get("rx")
        rx = None
        if rx_param is not None and rx_param != "":
            rx = str(rx_param).lower() in ("1", "true", "yes", "y")
        search = (request.query_params.get("search") or "").strip()
        rows = services.list_admin_categories(owner_id=owner_id, rx=rx, search=search)
        return Response(rows)


class AdminReviewsListView(_AdminOnlyView):
    """GET /v1/admin/reviews/"""

    def get(self, request):
        pharmacy_id = (request.query_params.get("pharmacyId") or "").strip() or None
        rating_param = (request.query_params.get("rating") or "").strip()
        rating = None
        if rating_param:
            try:
                rating = int(rating_param)
            except ValueError:
                rating = None
        search = (request.query_params.get("search") or "").strip()
        rows = services.list_admin_reviews(pharmacy_id=pharmacy_id, rating=rating, search=search)
        return Response(rows)


class AdminAuditsListView(_AdminOnlyView):
    """GET /v1/admin/audits/ (platform-wide with filters)"""

    def get(self, request):
        rows = services.list_admin_audits(
            actor_role=(request.query_params.get("actorRole") or "").strip() or None,
            action=(request.query_params.get("action") or "").strip() or None,
            resource_type=(request.query_params.get("resourceType") or "").strip() or None,
            owner_id=(request.query_params.get("ownerId") or "").strip() or None,
            from_dt=(request.query_params.get("from") or "").strip() or None,
            to_dt=(request.query_params.get("to") or "").strip() or None,
            search=(request.query_params.get("search") or "").strip(),
            limit=int(request.query_params.get("limit") or 200),
        )
        return Response(rows)


class AdminAnalyticsDashboardView(_AdminOnlyView):
    """GET /v1/admin/analytics/dashboard/"""

    def get(self, request):
        owner_id = (request.query_params.get("ownerId") or "").strip() or None
        payload = services.get_admin_analytics_dashboard(owner_id=owner_id)
        return Response(payload)


class AdminAnalyticsReportsView(_AdminOnlyView):
    """GET /v1/admin/analytics/reports/"""

    def get(self, request):
        owner_id = (request.query_params.get("ownerId") or "").strip() or None
        payload = services.get_admin_analytics_reports(owner_id=owner_id)
        return Response(payload)

