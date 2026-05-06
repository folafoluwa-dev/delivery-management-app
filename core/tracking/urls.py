from django.urls import path
from . import views

urlpatterns = [
    path("location/<int:order_id>/", views.get_driver_location, name="driver_location"),
    path("chat/<int:order_id>/", views.get_chat_history, name="chat_history"),
]
