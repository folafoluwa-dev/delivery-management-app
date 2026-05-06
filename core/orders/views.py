from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer, PriceEstimateSerializer
from .utils import haversine_distance, calculate_fare
from wallet.utils import debit_wallet, credit_wallet
from notifications.utils import create_notification

User = get_user_model()


from django.db import transaction


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_order(request, order_id):
    if request.user.role != "DRIVER":
        return Response({"error": "Only drivers can accept orders."}, status=403)

    # ✅ Lock the row to prevent two drivers accepting simultaneously
    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(
                id=order_id, status="PENDING", driver=None
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not available or already taken."}, status=404
            )

        order.driver = request.user
        order.status = "ACCEPTED"
        order.accepted_at = timezone.now()
        order.save()

    create_notification(
        order.rider, f"Your order #{order.id} has been accepted by {request.user.name}."
    )
    create_notification(
        request.user, f"You accepted order #{order.id}. Head to pickup location."
    )

    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def price_estimate(request):
    """Return fare estimate before placing order."""
    serializer = PriceEstimateSerializer(data=request.data)
    if serializer.is_valid():
        d = serializer.validated_data
        distance_km = haversine_distance(
            d["pickup_lat"], d["pickup_lng"], d["dropoff_lat"], d["dropoff_lng"]
        )
        pricing = calculate_fare(distance_km)
        return Response(pricing)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Rider creates a delivery order."""
    if request.user.role != "RIDER":
        return Response({"error": "Only riders can create orders."}, status=403)

    serializer = CreateOrderSerializer(data=request.data)
    if serializer.is_valid():
        d = serializer.validated_data

        # Calculate distance and fare
        distance_km = haversine_distance(
            d["pickup_lat"], d["pickup_lng"], d["dropoff_lat"], d["dropoff_lng"]
        )
        pricing = calculate_fare(distance_km)

        # Check wallet balance
        if request.user.wallet_balance < pricing["fare"]:
            return Response(
                {"error": f'Insufficient wallet balance. Required: ₦{pricing["fare"]}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Debit rider wallet
        debit_wallet(request.user, pricing["fare"], "Delivery fare payment")

        # Create order
        order = Order.objects.create(
            rider=request.user,
            distance_km=pricing["distance_km"],
            fare=pricing["fare"],
            driver_earnings=pricing["driver_earnings"],
            **serializer.validated_data,
        )

        create_notification(
            request.user, f"Your order #{order.id} has been placed successfully."
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def available_orders(request):
    if request.user.role != "DRIVER":
        return Response(
            {"error": "Only drivers can view available orders."}, status=403
        )

    if request.user.driver_profile.approval_status != "APPROVED":
        return Response({"error": "Your account is not approved yet."}, status=403)

    if not request.user.driver_profile.is_online:
        return Response({"error": "You must be online to view orders."}, status=403)

    # ✅ If driver has an active order, return that instead
    active = Order.objects.filter(
        driver=request.user, status__in=["ACCEPTED", "PICKED_UP"]
    ).first()

    if active:
        return Response({"active_order": OrderSerializer(active).data, "orders": []})

    orders = Order.objects.filter(status="PENDING", driver=None).order_by("-created_at")
    return Response(
        {"active_order": None, "orders": OrderSerializer(orders, many=True).data}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_order(request, order_id):
    """Driver accepts a pending order."""
    if request.user.role != "DRIVER":
        return Response({"error": "Only drivers can accept orders."}, status=403)

    try:
        order = Order.objects.get(id=order_id, status="PENDING", driver=None)
    except Order.DoesNotExist:
        return Response({"error": "Order not available or already taken."}, status=404)

    order.driver = request.user
    order.status = "ACCEPTED"
    order.accepted_at = timezone.now()
    order.save()

    create_notification(
        order.rider, f"Your order #{order.id} has been accepted by {request.user.name}."
    )
    create_notification(
        request.user, f"You have accepted order #{order.id}. Head to pickup location."
    )

    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_pickup(request, order_id):
    """Driver confirms they have picked up the package."""
    if request.user.role != "DRIVER":
        return Response({"error": "Only drivers can confirm pickup."}, status=403)

    try:
        order = Order.objects.get(id=order_id, driver=request.user, status="ACCEPTED")
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found or not in correct state."}, status=404
        )

    order.status = "PICKED_UP"
    order.picked_up_at = timezone.now()
    order.save()

    create_notification(
        order.rider,
        f"Your package for order #{order.id} has been picked up. On the way!",
    )

    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_delivery(request, order_id):
    """Driver confirms delivery. Credits driver wallet."""
    if request.user.role != "DRIVER":
        return Response({"error": "Only drivers can confirm delivery."}, status=403)

    try:
        order = Order.objects.get(id=order_id, driver=request.user, status="PICKED_UP")
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found or not in correct state."}, status=404
        )

    order.status = "DELIVERED"
    order.delivered_at = timezone.now()
    order.save()

    # Credit driver earnings
    credit_wallet(
        request.user, order.driver_earnings, f"Earnings from order #{order.id}"
    )

    # Update driver total earnings
    profile = request.user.driver_profile
    profile.total_earnings += order.driver_earnings
    profile.save()

    create_notification(
        order.rider,
        f"Your order #{order.id} has been delivered! Please rate your driver.",
    )
    create_notification(
        request.user,
        f"Delivery complete! ₦{order.driver_earnings} credited to your wallet.",
    )

    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """Rider cancels a pending order and gets refunded."""
    if request.user.role != "RIDER":
        return Response({"error": "Only riders can cancel orders."}, status=403)

    try:
        order = Order.objects.get(id=order_id, rider=request.user, status="PENDING")
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found or cannot be cancelled."}, status=404
        )

    order.status = "CANCELLED"
    order.save()

    # Refund rider
    credit_wallet(request.user, order.fare, f"Refund for cancelled order #{order.id}")
    create_notification(
        request.user,
        f"Order #{order.id} cancelled. ₦{order.fare} refunded to your wallet.",
    )

    return Response({"message": "Order cancelled and refunded successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_history(request):
    """Rider or driver views their order history."""
    if request.user.role == "RIDER":
        orders = Order.objects.filter(rider=request.user).order_by("-created_at")
    elif request.user.role == "DRIVER":
        orders = Order.objects.filter(driver=request.user).order_by("-created_at")
    else:
        return Response({"error": "Admins use the admin panel."}, status=403)

    return Response(OrderSerializer(orders, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """Get a single order detail."""
    try:
        if request.user.role == "RIDER":
            order = Order.objects.get(id=order_id, rider=request.user)
        elif request.user.role == "DRIVER":
            order = Order.objects.get(id=order_id, driver=request.user)
        else:
            order = Order.objects.get(id=order_id)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=404)
