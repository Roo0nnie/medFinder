"""
Analytics API views.
"""
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    MonthlySalesPointSerializer,
    OwnerStatsSerializer,
    PlatformStatsSerializer,
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
        owner_id = request.query_params.get("ownerId") or str(request.user.id)
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
        owner_id = request.query_params.get("ownerId")
        points = services.get_monthly_sales(owner_id=owner_id)
        serializer = MonthlySalesPointSerializer(points, many=True)
        return Response(serializer.data)


class TopProductsView(APIView):
    """
    GET top products chart data.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        owner_id = request.query_params.get("ownerId")
        try:
            limit = int(request.query_params.get("limit", "5"))
        except ValueError:
            limit = 5

        products = services.get_top_products(owner_id=owner_id, limit=limit)
        serializer = TopProductSerializer(products, many=True)
        return Response(serializer.data)


