import uuid
from django.db import models


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey("applications.Application", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    method = models.CharField(max_length=32, null=True, blank=True)  # cash/bank/transfer
    paid_at = models.DateTimeField(null=True, blank=True)
    reference = models.CharField(max_length=128, null=True, blank=True)


