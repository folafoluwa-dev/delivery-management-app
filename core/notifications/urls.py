from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_notifications, name="get_notifications"),
    path("mark-all-read/", views.mark_all_read, name="mark_all_read"),
    path("<int:notification_id>/read/", views.mark_one_read, name="mark_one_read"),
]
