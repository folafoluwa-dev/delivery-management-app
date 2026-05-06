from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from .models import Rating
from orders.models import Order


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_rating(request):
    order_id = request.data.get("order")
    stars = request.data.get("stars")
    comment = request.data.get("comment", "")

    if not order_id or not stars:
        return Response({"error": "Order and stars are required."}, status=400)

    if int(stars) < 1 or int(stars) > 5:
        return Response({"error": "Stars must be between 1 and 5."}, status=400)

    try:
        order = Order.objects.get(id=order_id, rider=request.user, status="DELIVERED")
    except Order.DoesNotExist:
        return Response({"error": "Order not found or not delivered yet."}, status=404)

    if hasattr(order, "rating"):
        return Response({"error": "You have already rated this order."}, status=400)

    rating = Rating.objects.create(
        order=order,
        rider=request.user,
        driver=order.driver,
        stars=stars,
        comment=comment,
    )

    # Update driver average rating
    avg = Rating.objects.filter(driver=order.driver).aggregate(Avg("stars"))[
        "stars__avg"
    ]
    order.driver.avg_rating = round(avg, 2)
    order.driver.save()

    return Response(
        {"message": "Rating submitted successfully.", "stars": rating.stars}
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_ratings(request):
    ratings = Rating.objects.filter(driver=request.user).order_by("-created_at")
    data = [
        {
            "id": r.id,
            "stars": r.stars,
            "comment": r.comment,
            "rider": r.rider.name,
            "order_id": r.order.id,
            "created_at": r.created_at,
        }
        for r in ratings
    ]
    return Response(data)
