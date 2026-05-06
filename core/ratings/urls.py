from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_rating, name="create_rating"),
    path("my-ratings/", views.driver_ratings, name="driver_ratings"),
]
