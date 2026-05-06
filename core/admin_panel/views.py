from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from accounts.models import DriverProfile
from orders.models import Order
from ratings.models import Rating
from wallet.utils import credit_wallet
from notifications.utils import create_notification

User = get_user_model()


def is_admin(user):
    return user.role == "ADMIN"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def credit_driver_wallet(request, driver_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        profile = DriverProfile.objects.get(user__id=driver_id)
        amount = request.data.get("amount")
        if not amount or float(amount) <= 0:
            return Response({"error": "Invalid amount."}, status=400)
        credit_wallet(profile.user, float(amount), "Admin wallet top-up")
        create_notification(
            profile.user, f"💰 ₦{amount} has been credited to your wallet by admin."
        )
        profile.user.refresh_from_db()
        return Response(
            {
                "message": f"₦{amount} credited to {profile.user.name}.",
                "new_balance": profile.user.wallet_balance,
            }
        )
    except DriverProfile.DoesNotExist:
        return Response({"error": "Driver not found."}, status=404)


# ─── Stats ────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)

    total_users = User.objects.filter(role="RIDER").count()
    total_drivers = User.objects.filter(role="DRIVER").count()
    approved_drivers = DriverProfile.objects.filter(approval_status="APPROVED").count()
    pending_drivers = DriverProfile.objects.filter(approval_status="PENDING").count()
    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(status="DELIVERED").count()
    cancelled_orders = Order.objects.filter(status="CANCELLED").count()
    total_revenue = (
        Order.objects.filter(status="DELIVERED").aggregate(total=Sum("fare"))["total"]
        or 0
    )
    platform_commission = float(total_revenue) * 0.15

    return Response(
        {
            "total_users": total_users,
            "total_drivers": total_drivers,
            "approved_drivers": approved_drivers,
            "pending_drivers": pending_drivers,
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "total_revenue": total_revenue,
            "platform_commission": round(platform_commission, 2),
        }
    )


# ─── Drivers ──────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_drivers(request):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)

    status_filter = request.query_params.get("status", None)
    profiles = DriverProfile.objects.select_related("user").all()
    if status_filter:
        profiles = profiles.filter(approval_status=status_filter.upper())

    data = [
        {
            "id": p.user.id,
            "name": p.user.name,
            "email": p.user.email,
            "phone": p.user.phone,
            "vehicle_type": p.vehicle_type,
            "approval_status": p.approval_status,
            "is_online": p.is_online,
            "avg_rating": p.user.avg_rating,
            "total_earnings": p.total_earnings,
            "total_deliveries": Order.objects.filter(
                driver=p.user, status="DELIVERED"
            ).count(),
            "date_joined": p.user.date_joined,
        }
        for p in profiles
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_driver(request, driver_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        profile = DriverProfile.objects.get(user__id=driver_id)
        profile.approval_status = "APPROVED"
        profile.save()
        create_notification(
            profile.user,
            "🎉 Your driver account has been approved! You can now go online and accept orders.",
        )
        return Response({"message": f"{profile.user.name} approved successfully."})
    except DriverProfile.DoesNotExist:
        return Response({"error": "Driver not found."}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_driver(request, driver_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        profile = DriverProfile.objects.get(user__id=driver_id)
        profile.approval_status = "REJECTED"
        profile.is_online = False  # ✅ Force offline immediately
        profile.save()
        create_notification(
            profile.user,
            "❌ Your driver account has been revoked. You have been taken offline. Contact support for more info.",
        )
        return Response({"message": f"{profile.user.name} rejected."})
    except DriverProfile.DoesNotExist:
        return Response({"error": "Driver not found."}, status=404)


# ─── Ratings ──────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_ratings(request):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)

    ratings = Rating.objects.select_related("rider", "driver", "order").order_by(
        "-created_at"
    )
    data = [
        {
            "id": r.id,
            "stars": r.stars,
            "comment": r.comment,
            "rider": r.rider.name,
            "driver": r.driver.name,
            "order_id": r.order.id,
            "created_at": r.created_at,
        }
        for r in ratings
    ]
    return Response(data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_rating(request, rating_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        rating = Rating.objects.get(id=rating_id)
        rating.delete()
        return Response({"message": "Rating deleted."})
    except Rating.DoesNotExist:
        return Response({"error": "Rating not found."}, status=404)


# ─── Users ────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)

    users = User.objects.filter(role="RIDER").order_by("-date_joined")
    data = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "wallet_balance": u.wallet_balance,
            "is_active": u.is_active,
            "date_joined": u.date_joined,
            "total_orders": Order.objects.filter(rider=u).count(),
        }
        for u in users
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_user_active(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        user = User.objects.get(id=user_id, role="RIDER")
        user.is_active = not user.is_active
        user.save()
        return Response(
            {
                "message": f'{user.name} is now {"active" if user.is_active else "deactivated"}.',
                "is_active": user.is_active,
            }
        )
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def credit_user_wallet(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)
    try:
        # ✅ Look for ANY user, not just riders
        user = User.objects.get(id=user_id)
        amount = request.data.get("amount")
        if not amount or float(amount) <= 0:
            return Response({"error": "Invalid amount."}, status=400)
        credit_wallet(user, float(amount), "Admin wallet top-up")
        create_notification(
            user, f"💰 ₦{amount} has been credited to your wallet by admin."
        )
        # ✅ Return updated balance so frontend can reflect it
        user.refresh_from_db()
        return Response(
            {
                "message": f"₦{amount} credited to {user.name}.",
                "new_balance": user.wallet_balance,
            }
        )
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)


# ─── Orders ───────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_orders(request):
    if not is_admin(request.user):
        return Response({"error": "Unauthorized"}, status=403)

    orders = Order.objects.select_related("rider", "driver").order_by("-created_at")[
        :50
    ]
    data = [
        {
            "id": o.id,
            "rider": o.rider.name,
            "driver": o.driver.name if o.driver else None,
            "pickup_address": o.pickup_address,
            "dropoff_address": o.dropoff_address,
            "status": o.status,
            "fare": o.fare,
            "distance_km": o.distance_km,
            "created_at": o.created_at,
        }
        for o in orders
    ]
    return Response(data)
