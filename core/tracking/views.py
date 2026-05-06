from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import DriverLocation, ChatMessage
from .serializers import DriverLocationSerializer

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_driver_location(request, order_id):
    """Rider polls driver location for a specific order."""
    from orders.models import Order

    try:
        order = Order.objects.get(id=order_id, rider=request.user)
        if not order.driver:
            return Response({"error": "No driver assigned yet."}, status=404)
        location = DriverLocation.objects.get(driver=order.driver)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "available_drivers",
            {
                "type": "new_order",
                "order_id": order.id,
                "pickup_address": order.pickup_address,
                "dropoff_address": order.dropoff_address,
                "fare": str(order.fare),
                "distance_km": str(order.distance_km),
            },
        )
        return Response(DriverLocationSerializer(location).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=404)
    except DriverLocation.DoesNotExist:

        return Response({"error": "Driver location not available yet."}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat_history(request, order_id):
    """Load previous messages for an order."""
    from orders.models import Order

    try:
        order = Order.objects.get(id=order_id)
        # Only rider or driver of this order can see chat
        if request.user != order.rider and request.user != order.driver:
            return Response({"error": "Unauthorized."}, status=403)

        messages = ChatMessage.objects.filter(order=order).select_related("sender")
        data = [
            {
                "message_id": m.id,
                "message": m.message,
                "sender_id": m.sender.id,
                "sender_name": m.sender.name,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
        return Response(data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=404)
