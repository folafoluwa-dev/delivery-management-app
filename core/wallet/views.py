import hmac
import hashlib
import requests
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction, PaystackTransaction
from .serializers import TransactionSerializer
from .utils import credit_wallet
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    return Response({"balance": request.user.wallet_balance})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    transactions = Transaction.objects.filter(user=request.user).order_by("-created_at")
    return Response(TransactionSerializer(transactions, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """Initialize Paystack transaction and return reference."""
    amount = request.data.get("amount")

    if not amount or float(amount) < 100:
        return Response(
            {"error": "Minimum top-up amount is ₦100."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if float(amount) > 1000000:
        return Response(
            {"error": "Maximum top-up amount is ₦1,000,000."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate unique reference
    reference = f"DELIVERNG-{uuid.uuid4().hex[:12].upper()}"

    # Save pending transaction
    PaystackTransaction.objects.create(
        user=request.user,
        reference=reference,
        amount=Decimal(str(amount)),
        status="PENDING",
    )

    return Response(
        {
            "reference": reference,
            "amount": float(amount),
            "email": request.user.email,
            "public_key": settings.PAYSTACK_PUBLIC_KEY,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify payment after Paystack callback and credit wallet."""
    reference = request.data.get("reference")

    if not reference:
        return Response({"error": "Reference is required."}, status=400)

    try:
        paystack_tx = PaystackTransaction.objects.get(
            reference=reference, user=request.user, status="PENDING"
        )
    except PaystackTransaction.DoesNotExist:
        return Response(
            {"error": "Transaction not found or already processed."}, status=404
        )

    # Verify with Paystack API
    headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}
    res = requests.get(
        f"https://api.paystack.co/transaction/verify/{reference}", headers=headers
    )
    data = res.json()

    if not data.get("status") or data["data"]["status"] != "success":
        paystack_tx.status = "FAILED"
        paystack_tx.save()
        return Response({"error": "Payment verification failed."}, status=400)

    # Check amount matches (Paystack returns amount in kobo)
    paid_amount = Decimal(str(data["data"]["amount"] / 100))
    if paid_amount != paystack_tx.amount:
        return Response({"error": "Amount mismatch."}, status=400)

    # Credit wallet
    paystack_tx.status = "SUCCESS"
    paystack_tx.verified_at = timezone.now()
    paystack_tx.save()

    credit_wallet(
        request.user, paystack_tx.amount, f"Wallet top-up via Paystack ({reference})"
    )

    request.user.refresh_from_db()

    return Response(
        {
            "message": f"₦{paystack_tx.amount} added to your wallet!",
            "new_balance": request.user.wallet_balance,
            "reference": reference,
        }
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """Paystack webhook — backup verification in case frontend fails."""
    paystack_secret = settings.PAYSTACK_SECRET_KEY
    signature = request.headers.get("X-Paystack-Signature", "")

    # Verify webhook signature
    computed = hmac.new(
        paystack_secret.encode("utf-8"), request.body, hashlib.sha512
    ).hexdigest()

    if computed != signature:
        return Response({"error": "Invalid signature."}, status=400)

    payload = request.data
    event = payload.get("event")

    if event == "charge.success":
        reference = payload["data"]["reference"]
        amount_kobo = payload["data"]["amount"]
        paid_amount = Decimal(str(amount_kobo / 100))

        try:
            paystack_tx = PaystackTransaction.objects.get(
                reference=reference, status="PENDING"
            )
            paystack_tx.status = "SUCCESS"
            paystack_tx.verified_at = timezone.now()
            paystack_tx.save()

            credit_wallet(
                paystack_tx.user,
                paid_amount,
                f"Wallet top-up via Paystack ({reference})",
            )
        except PaystackTransaction.DoesNotExist:
            pass  # Already processed or doesn't exist

    return Response({"status": "ok"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def topup_wallet(request):
    """Simulated top-up — kept for admin/testing use."""
    amount = request.data.get("amount")
    if not amount or float(amount) < 100:
        return Response({"error": "Minimum top-up is ₦100."}, status=400)
    credit_wallet(request.user, Decimal(str(float(amount))), "Wallet top-up (demo)")
    request.user.refresh_from_db()
    return Response(
        {
            "message": f"₦{amount} added to your wallet.",
            "new_balance": request.user.wallet_balance,
        }
    )
