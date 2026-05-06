from django.db import models
from django.conf import settings


class Order(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("PICKED_UP", "Picked Up"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
    ]

    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rider_orders"
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="driver_orders",
    )
    pickup_address = models.CharField(max_length=500)
    dropoff_address = models.CharField(max_length=500)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    driver_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    package_description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} — {self.status} ({self.rider})"
