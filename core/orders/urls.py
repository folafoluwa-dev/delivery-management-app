from django.urls import path
from . import views

urlpatterns = [
    path("estimate/", views.price_estimate, name="price_estimate"),
    path("create/", views.create_order, name="create_order"),
    path("available/", views.available_orders, name="available_orders"),
    path("history/", views.order_history, name="order_history"),
    path("<int:order_id>/", views.order_detail, name="order_detail"),
    path("<int:order_id>/accept/", views.accept_order, name="accept_order"),
    path("<int:order_id>/pickup/", views.confirm_pickup, name="confirm_pickup"),
    path("<int:order_id>/deliver/", views.confirm_delivery, name="confirm_delivery"),
    path("<int:order_id>/cancel/", views.cancel_order, name="cancel_order"),
]
