from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DriverProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    vehicle_type = serializers.ChoiceField(
        choices=["BIKE", "CAR", "VAN"], write_only=True, required=False
    )

    class Meta:
        model = User
        fields = ["id", "name", "email", "phone", "role", "password", "vehicle_type"]

    def validate(self, data):
        if data.get("role") == "DRIVER" and not data.get("vehicle_type"):
            raise serializers.ValidationError({"vehicle_type": "Required for drivers."})
        if data.get("role") == "ADMIN":
            raise serializers.ValidationError(
                {"role": "Cannot self-register as admin."}
            )
        return data

    def create(self, validated_data):
        vehicle_type = validated_data.pop("vehicle_type", None)
        user = User.objects.create_user(**validated_data)
        if user.role == "DRIVER":
            DriverProfile.objects.create(user=user, vehicle_type=vehicle_type)
        return user


class UserSerializer(serializers.ModelSerializer):
    driver_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "role",
            "wallet_balance",
            "avg_rating",
            "driver_profile",
        ]

    def get_driver_profile(self, obj):
        if obj.role == "DRIVER":
            try:
                profile = obj.driver_profile
                return {
                    "vehicle_type": profile.vehicle_type,
                    "approval_status": profile.approval_status,
                    "is_online": profile.is_online,
                    "total_earnings": str(profile.total_earnings),
                }
            except DriverProfile.DoesNotExist:
                return None
        return None


class DriverStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = ["is_online"]
