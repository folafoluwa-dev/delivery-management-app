from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    rider_name = serializers.CharField(source="rider.name", read_only=True)
    driver_name = serializers.CharField(source="driver.name", read_only=True)
    driver_avg_rating = serializers.DecimalField(
        source="driver.avg_rating", max_digits=3, decimal_places=2, read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "rider",
            "rider_name",
            "driver",
            "driver_name",
            "driver_avg_rating",
            "pickup_address",
            "dropoff_address",
            "pickup_lat",
            "pickup_lng",
            "dropoff_lat",
            "dropoff_lng",
            "status",
            "distance_km",
            "fare",
            "driver_earnings",
            "package_description",
            "created_at",
            "accepted_at",
            "picked_up_at",
            "delivered_at",
        ]
        read_only_fields = [
            "rider",
            "driver",
            "status",
            "fare",
            "distance_km",
            "driver_earnings",
            "accepted_at",
            "picked_up_at",
            "delivered_at",
        ]


class CreateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "pickup_address",
            "dropoff_address",
            "pickup_lat",
            "pickup_lng",
            "dropoff_lat",
            "dropoff_lng",
            "package_description",
        ]


class PriceEstimateSerializer(serializers.Serializer):
    pickup_lat = serializers.FloatField()
    pickup_lng = serializers.FloatField()
    dropoff_lat = serializers.FloatField()
    dropoff_lng = serializers.FloatField()
