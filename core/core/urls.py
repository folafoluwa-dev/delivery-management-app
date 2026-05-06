from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/wallet/", include("wallet.urls")),
    path("api/ratings/", include("ratings.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/tracking/", include("tracking.urls")),
    path("api/admin-panel/", include("admin_panel.urls")),
    path("api/ratings/", include("ratings.urls")),
    path("admin/", admin.site.urls),
]
