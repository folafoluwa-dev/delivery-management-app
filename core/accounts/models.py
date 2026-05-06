from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "ADMIN")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("RIDER", "Rider"),
        ("DRIVER", "Driver"),
        ("ADMIN", "Admin"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="RIDER")
    wallet_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    groups = models.ManyToManyField(
        "auth.Group", blank=True, related_name="accounts_users"
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission", blank=True, related_name="accounts_users"
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "phone"]

    def __str__(self):
        return f"{self.name} ({self.role})"


class DriverProfile(models.Model):
    VEHICLE_CHOICES = [
        ("BIKE", "Bike"),
        ("CAR", "Car"),
        ("VAN", "Van"),
    ]

    APPROVAL_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="driver_profile"
    )
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_CHOICES)
    approval_status = models.CharField(
        max_length=10, choices=APPROVAL_CHOICES, default="PENDING"
    )
    is_online = models.BooleanField(default=False)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} — {self.vehicle_type} ({self.approval_status})"
