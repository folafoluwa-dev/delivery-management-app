from rest_framework import serializers
from .models import DriverLocation


class DriverLocationSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source="driver.name", read_only=True)

    class Meta:
        model = DriverLocation
        fields = ["driver_name", "lat", "lng", "updated_at"]
