from django.urls import path
from . import views

urlpatterns = [
    path("stats/", views.dashboard_stats, name="dashboard_stats"),
    # Drivers
    path("drivers/", views.list_drivers, name="list_drivers"),
    path(
        "drivers/<int:driver_id>/approve/", views.approve_driver, name="approve_driver"
    ),
    path("drivers/<int:driver_id>/reject/", views.reject_driver, name="reject_driver"),
    # Ratings
    path("ratings/", views.list_ratings, name="admin_ratings"),
    path("ratings/<int:rating_id>/delete/", views.delete_rating, name="delete_rating"),
    # Users
    path("users/", views.list_users, name="list_users"),
    path(
        "users/<int:user_id>/toggle-active/",
        views.toggle_user_active,
        name="toggle_user_active",
    ),
    path(
        "users/<int:user_id>/credit-wallet/",
        views.credit_user_wallet,
        name="credit_wallet",
    ),
    # Orders
    path("orders/", views.list_orders, name="admin_orders"),
    path(
        "drivers/<int:driver_id>/credit-wallet/",
        views.credit_driver_wallet,
        name="credit_driver_wallet",
    ),
]
