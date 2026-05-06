from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/tracking/(?P<order_id>\w+)/$", consumers.TrackingConsumer.as_asgi()),
    re_path(r"ws/orders/available/$", consumers.DriverAvailabilityConsumer.as_asgi()),
    re_path(r"ws/chat/(?P<order_id>\w+)/$", consumers.ChatConsumer.as_asgi()),
]
