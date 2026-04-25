"""
Analytics serializers for platform, owner, and staff stats, as well as chart data.
"""
from rest_framework import serializers


class PlatformStatsSerializer(serializers.Serializer):
    totalPharmacies = serializers.IntegerField()
    totalInventoryItems = serializers.IntegerField()
    totalReservations = serializers.IntegerField()


class OwnerStatsSerializer(serializers.Serializer):
    productsAndVariantsCount = serializers.IntegerField()
    staffActiveCount = serializers.IntegerField()
    staffInactiveCount = serializers.IntegerField()
    inventoryInStockCount = serializers.IntegerField()
    inventoryLowStockCount = serializers.IntegerField()
    inventoryOutOfStockCount = serializers.IntegerField()
    pendingDeletionRequestsCount = serializers.IntegerField()
    categoriesCount = serializers.IntegerField()
    brandsCount = serializers.IntegerField()


class StaffStatsSerializer(serializers.Serializer):
    activeReservations = serializers.IntegerField()
    completedReservations = serializers.IntegerField()


class StaffDashboardStatsSerializer(serializers.Serializer):
    totalProductsManaged = serializers.IntegerField()
    itemsOutOfStock = serializers.IntegerField()
    lowStockAlerts = serializers.IntegerField()


class MonthlySalesPointSerializer(serializers.Serializer):
    name = serializers.CharField()
    sales = serializers.FloatField()


class StaffDashboardTrendPointSerializer(serializers.Serializer):
    day = serializers.CharField()
    stock = serializers.IntegerField()


class StaffDashboardRecentUpdateSerializer(serializers.Serializer):
    id = serializers.CharField()
    productName = serializers.CharField()
    variantLabel = serializers.CharField(required=False, allow_null=True)
    currentQuantity = serializers.IntegerField(required=False, allow_null=True)
    direction = serializers.ChoiceField(choices=["increase", "decrease", "update"])
    action = serializers.CharField()
    updatedAt = serializers.CharField()


class StaffDashboardInventoryRowSerializer(serializers.Serializer):
    id = serializers.CharField()
    productName = serializers.CharField()
    variantLabel = serializers.CharField(required=False, allow_null=True)
    sku = serializers.CharField()
    stockLimit = serializers.IntegerField()
    currentStock = serializers.IntegerField()
    stockStatus = serializers.ChoiceField(choices=["ok", "low", "out", "unavailable"])


class StaffDashboardResponseSerializer(serializers.Serializer):
    stats = StaffDashboardStatsSerializer()
    trend = StaffDashboardTrendPointSerializer(many=True)
    recentUpdates = StaffDashboardRecentUpdateSerializer(many=True)
    inventoryList = StaffDashboardInventoryRowSerializer(many=True)


class TopProductSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.FloatField()


class ReviewRatingPointSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.FloatField()


class SearchTrendPointSerializer(serializers.Serializer):
    name = serializers.CharField()
    count = serializers.IntegerField()


class PeakHourPointSerializer(serializers.Serializer):
    hour = serializers.IntegerField(min_value=0, max_value=23)
    count = serializers.IntegerField()


class ProductSearchSelectionCreateSerializer(serializers.Serializer):
    productId = serializers.CharField(max_length=255)
    pharmacyId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    searchQuery = serializers.CharField(required=False, allow_blank=True, default="")


class ProductEngagementCreateSerializer(serializers.Serializer):
    productId = serializers.CharField(max_length=255)
    dwellSeconds = serializers.IntegerField(min_value=0, max_value=86400, default=0)
    sessionId = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)


