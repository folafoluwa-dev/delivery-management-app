import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class TrackingConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.room_group_name = f"tracking_{self.order_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            lat = data.get("lat")
            lng = data.get("lng")
            driver_id = data.get("driver_id")
            if lat is None or lng is None or driver_id is None:
                return
            await self.save_driver_location(driver_id, lat, lng)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "location_update",
                    "lat": lat,
                    "lng": lng,
                    "driver_id": driver_id,
                },
            )
        except (json.JSONDecodeError, KeyError):
            pass

    async def location_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "location_update",
                    "lat": event["lat"],
                    "lng": event["lng"],
                    "driver_id": event["driver_id"],
                }
            )
        )

    @database_sync_to_async
    def save_driver_location(self, driver_id, lat, lng):
        from django.contrib.auth import get_user_model
        from .models import DriverLocation

        User = get_user_model()
        try:
            driver = User.objects.get(id=driver_id)
            DriverLocation.objects.update_or_create(
                driver=driver, defaults={"lat": lat, "lng": lng}
            )
            profile = driver.driver_profile
            profile.current_lat = lat
            profile.current_lng = lng
            profile.save()
        except User.DoesNotExist:
            pass


class DriverAvailabilityConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = "available_drivers"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def new_order(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_order",
                    "order_id": event["order_id"],
                    "pickup_address": event["pickup_address"],
                    "dropoff_address": event["dropoff_address"],
                    "fare": event["fare"],
                    "distance_km": event["distance_km"],
                }
            )
        )


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.room_group_name = f"chat_{self.order_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get("message", "").strip()
            sender_id = data.get("sender_id")
            if not message or not sender_id:
                return

            # Save to DB
            saved = await self.save_message(sender_id, message)
            if not saved:
                return

            # Broadcast to both rider and driver
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    "sender_id": sender_id,
                    "sender_name": saved["sender_name"],
                    "created_at": saved["created_at"],
                    "message_id": saved["message_id"],
                },
            )
        except (json.JSONDecodeError, KeyError):
            pass

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                    "sender_id": event["sender_id"],
                    "sender_name": event["sender_name"],
                    "created_at": event["created_at"],
                    "message_id": event["message_id"],
                }
            )
        )

    @database_sync_to_async
    def save_message(self, sender_id, message):
        from django.contrib.auth import get_user_model
        from orders.models import Order
        from .models import ChatMessage

        User = get_user_model()
        try:
            sender = User.objects.get(id=sender_id)
            order = Order.objects.get(id=self.order_id)

            # Only allow chat if order is active
            if order.status not in ["ACCEPTED", "PICKED_UP"]:
                return None

            # Only allow rider or driver of this order
            if sender != order.rider and sender != order.driver:
                return None

            msg = ChatMessage.objects.create(
                order=order,
                sender=sender,
                message=message,
            )
            return {
                "message_id": msg.id,
                "sender_name": sender.name,
                "created_at": msg.created_at.isoformat(),
            }
        except (User.DoesNotExist, Order.DoesNotExist):
            return None
