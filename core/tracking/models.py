from django.db import models
from django.conf import settings


class DriverLocation(models.Model):
    driver = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="location"
    )
    lat = models.FloatField()
    lng = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.driver.name} — ({self.lat}, {self.lng})"


class ChatMessage(models.Model):
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.name} → Order #{self.order.id}: {self.message[:40]}"
