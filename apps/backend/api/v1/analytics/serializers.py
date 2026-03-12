"""
Analytics serializers for platform, owner, and staff stats, as well as chart data.
"""
from rest_framework import serializers


class PlatformStatsSerializer(serializers.Serializer):
    totalPharmacies = serializers.IntegerField()
    totalInventoryItems = serializers.IntegerField()
    totalReservations = serializers.IntegerField()


class OwnerStatsSerializer(serializers.Serializer):
    pharmaciesCount = serializers.IntegerField()
    inventoryItemsCount = serializers.IntegerField()
    reservationsCount = serializers.IntegerField()


class StaffStatsSerializer(serializers.Serializer):
    activeReservations = serializers.IntegerField()
    completedReservations = serializers.IntegerField()


class MonthlySalesPointSerializer(serializers.Serializer):
    name = serializers.CharField()
    sales = serializers.FloatField()


class TopProductSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.FloatField()


