from django.urls import path
from . import views

urlpatterns = [
    path("balance/", views.wallet_balance, name="wallet_balance"),
    path("transactions/", views.transaction_history, name="transaction_history"),
    path("topup/", views.topup_wallet, name="topup_wallet"),
    path("initialize-payment/", views.initialize_payment, name="initialize_payment"),
    path("verify-payment/", views.verify_payment, name="verify_payment"),
    path("webhook/", views.paystack_webhook, name="paystack_webhook"),
]
