from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer
from .models import DriverProfile

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_online(request):
    if request.user.role != "DRIVER":
        return Response(
            {"error": "Only drivers can toggle availability."},
            status=status.HTTP_403_FORBIDDEN,
        )
    try:
        profile = request.user.driver_profile

        # ✅ Always recheck approval before allowing online
        if profile.approval_status != "APPROVED":
            # Force offline in case they were revoked while online
            profile.is_online = False
            profile.save()
            return Response(
                {"error": "Your account is not approved. You have been taken offline."},
                status=status.HTTP_403_FORBIDDEN,
            )

        profile.is_online = not profile.is_online
        profile.save()
        return Response({"is_online": profile.is_online})
    except DriverProfile.DoesNotExist:
        return Response(
            {"error": "Driver profile not found."}, status=status.HTTP_404_NOT_FOUND
        )
