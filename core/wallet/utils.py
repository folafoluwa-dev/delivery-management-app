from decimal import Decimal
from .models import Transaction


def debit_wallet(user, amount, description):
    amount = Decimal(str(amount))  # ✅ Always convert to Decimal
    user.wallet_balance -= amount
    user.save()
    Transaction.objects.create(
        user=user,
        amount=amount,
        transaction_type="DEBIT",
        description=description,
        balance_after=user.wallet_balance,
    )


def credit_wallet(user, amount, description):
    amount = Decimal(str(amount))  # ✅ Always convert to Decimal
    user.wallet_balance += amount
    user.save()
    Transaction.objects.create(
        user=user,
        amount=amount,
        transaction_type="CREDIT",
        description=description,
        balance_after=user.wallet_balance,
    )
