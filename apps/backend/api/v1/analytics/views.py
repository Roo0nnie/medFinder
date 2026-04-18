"""
Analytics API views.
"""
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import authz, services
from .serializers import (
    MonthlySalesPointSerializer,
    OwnerStatsSerializer,
    PeakHourPointSerializer,
    PlatformStatsSerializer,
    ProductEngagementCreateSerializer,
    ProductSearchSelectionCreateSerializer,
    ReviewRatingPointSerializer,
    SearchTrendPointSerializer,
    StaffStatsSerializer,
    TopProductSerializer,
)


class PlatformStatsView(APIView):
    """
    GET platform-wide analytics stats.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        stats = services.get_platform_stats()
        serializer = PlatformStatsSerializer(stats)
        return Response(serializer.data)


class OwnerStatsView(APIView):
    """
    GET owner-scoped analytics stats.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_stats(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        stats = services.get_owner_stats(owner_id)
        serializer = OwnerStatsSerializer(stats)
        return Response(serializer.data)


class StaffStatsView(APIView):
    """
    GET staff-scoped analytics stats.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get("userId") or str(request.user.id)
        stats = services.get_staff_stats(user_id)
        serializer = StaffStatsSerializer(stats)
        return Response(serializer.data)


class MonthlySalesView(APIView):
    """
    GET monthly sales chart data.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        points = services.get_monthly_sales(owner_id=owner_id)
        serializer = MonthlySalesPointSerializer(points, many=True)
        return Response(serializer.data)


class OwnerReviewRatingsView(APIView):
    """
    GET counts of pharmacy + product reviews per star rating (1–5) for the owner.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        points = services.get_owner_review_rating_distribution(owner_id=owner_id)
        serializer = ReviewRatingPointSerializer(points, many=True)
        return Response(serializer.data)


class TopProductsView(APIView):
    """
    GET top products chart data.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "5"))
        except ValueError:
            limit = 5

        products = services.get_top_products(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


class OwnerTopCategoriesView(APIView):
    """
    GET product counts grouped by category for the owner catalog.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "8"))
        except ValueError:
            limit = 8
        limit = max(1, min(limit, 50))
        rows = services.get_top_categories_by_products(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(rows, many=True)
        return Response(serializer.data)


class OwnerTopSearchesView(APIView):
    """
    GET aggregated search queries that surfaced the owner's catalog.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_stats(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "20"))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 100))
        items = services.get_owner_top_search_queries(owner_id=owner_id, limit=limit)
        return Response({"items": items})


class OwnerTopProductsByViewsView(APIView):
    """
    GET products with the most detail-page engagement events for the owner.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        products = services.get_owner_top_products_by_views(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


class OwnerSearchTrendsView(APIView):
    """
    GET search volume by day or week for owner-attributed product searches.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        g = (request.query_params.get("granularity") or "daily").strip().lower()
        if g not in ("daily", "weekly"):
            g = "daily"
        points = services.get_owner_search_trends(owner_id=owner_id, granularity=g)
        serializer = SearchTrendPointSerializer(points, many=True)
        return Response(serializer.data)


class OwnerSearchPeakHoursView(APIView):
    """
    GET search counts by hour of day (0-23) for owner-attributed searches.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        points = services.get_owner_search_peak_hours(owner_id=owner_id)
        serializer = PeakHourPointSerializer(points, many=True)
        return Response(serializer.data)


class OwnerNoResultSearchesView(APIView):
    """
    GET top queries with zero results (platform-wide; owner cannot be inferred).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None) or ""
        if role not in ("owner", "admin"):
            return Response({"detail": "Owner or admin access required."}, status=403)
        try:
            limit = int(request.query_params.get("limit", "25"))
        except ValueError:
            limit = 25
        limit = max(1, min(limit, 100))
        items = services.get_owner_no_result_search_queries(limit=limit)
        return Response({"items": items})


class OwnerBottomProductsByViewsView(APIView):
    """GET products with the fewest detail-page views (min 1 view)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        products = services.get_owner_bottom_products_by_views(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


class OwnerTrendingProductsByViewsView(APIView):
    """GET products with largest view delta (recent vs previous window)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        try:
            window_days = int(request.query_params.get("windowDays", "7"))
        except ValueError:
            window_days = 7
        window_days = max(1, min(window_days, 90))
        products = services.get_owner_trending_products_by_views(
            owner_id=owner_id, window_days=window_days, limit=limit
        )
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


class OwnerHighDemandOutOfStockView(APIView):
    """GET high recent views + out-of-stock inventory for owner's catalog."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        try:
            days = int(request.query_params.get("engagementDays", "30"))
        except ValueError:
            days = 30
        days = max(1, min(days, 365))
        products = services.get_owner_high_demand_out_of_stock(
            owner_id=owner_id, limit=limit, engagement_window_days=days
        )
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name="dispatch")
class ProductEngagementCreateView(APIView):
    """
    POST a single product page engagement event (view/dwell); public + authenticated.
    CSRF exempt so the browser can send keepalive/beacon-style requests without a token.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        ser = ProductEngagementCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user_id = None
        if request.user and request.user.is_authenticated:
            user_id = str(request.user.id)
        sid = data.get("sessionId")
        services.record_product_engagement(
            product_id=data["productId"],
            user_id=user_id,
            session_id=sid if sid else None,
            dwell_seconds=int(data.get("dwellSeconds") or 0),
        )
        return Response({"success": True}, status=201)


class AuditEventsListView(APIView):
    """GET audit events for the authenticated owner (or admin with ownerId)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_stats(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "200"))
        except ValueError:
            limit = 200
        limit = max(1, min(limit, 500))
        rows = services.list_audit_events_for_owner(owner_id=owner_id, limit=limit)
        return Response({"items": rows})


@method_decorator(csrf_exempt, name="dispatch")
class SessionAuditView(APIView):
    """
    POST { event: login | logout } — append owner/staff session events to the pharmacy owner's audit log.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from api.v1.analytics.audit_helpers import audit_actor_from_request, owner_id_for_staff_user, safe_log_audit_event

        raw = request.data if isinstance(request.data, dict) else {}
        event = (raw.get("event") or "").strip().lower()
        if event not in ("login", "logout"):
            return Response({"detail": "event must be 'login' or 'logout'."}, status=400)

        user = request.user
        role = getattr(user, "role", None)
        owner_id = None
        if role == "owner":
            owner_id = str(user.id)
        elif role == "staff":
            owner_id = owner_id_for_staff_user(str(user.id))
        else:
            return Response({"success": True}, status=200)

        if not owner_id:
            return Response({"success": True}, status=200)

        actor_uid, actor_role = audit_actor_from_request(request)
        safe_log_audit_event(
            owner_id=owner_id,
            actor_user_id=actor_uid,
            actor_role=actor_role or str(role or ""),
            action="LOGIN" if event == "login" else "LOGOUT",
            resource_type="Session",
            resource_id=str(user.id),
            details="",
        )
        return Response({"success": True}, status=200)


@method_decorator(csrf_exempt, name="dispatch")
class ProductSearchSelectionCreateView(APIView):
    """POST when a user opens a product from search results (search attribution)."""

    permission_classes = [AllowAny]

    def post(self, request):
        ser = ProductSearchSelectionCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user_id = None
        if request.user and request.user.is_authenticated:
            user_id = str(request.user.id)
        services.record_product_search_selection(
            product_id=data["productId"],
            pharmacy_id=data.get("pharmacyId") or None,
            search_query=data.get("searchQuery") or "",
            customer_id=user_id,
        )
        return Response({"success": True}, status=201)


class OwnerTopProductsBySearchSelectionsView(APIView):
    """GET products most opened from search (requires selection telemetry)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        products = services.get_owner_top_products_by_search_selections(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


class OwnerTopStaffByAuditActionsView(APIView):
    """GET top staff by audit event count (staff role only, roster-scoped)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            owner_id = authz.resolve_owner_id_for_owner_charts(request)
        except ValidationError as e:
            return Response(e.detail, status=400)
        except PermissionDenied as e:
            return Response({"detail": e.detail}, status=403)
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 50))
        rows = services.get_owner_top_staff_by_audit_actions(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(rows, many=True)
        return Response(serializer.data)


