import math
from django.conf import settings


def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance in km between two coordinates."""
    R = 6371  # Earth radius in km

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def calculate_fare(distance_km):
    """Calculate fare, driver earnings and commission."""
    base_fare = settings.BASE_FARE
    fare_per_km = settings.FARE_PER_KM
    commission_rate = settings.PLATFORM_COMMISSION

    fare = base_fare + (distance_km * fare_per_km)
    commission = fare * commission_rate
    driver_earnings = fare - commission

    return {
        "fare": round(fare, 2),
        "commission": round(commission, 2),
        "driver_earnings": round(driver_earnings, 2),
        "distance_km": distance_km,
    }
