from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "transaction_type",
            "description",
            "balance_after",
            "created_at",
        ]
