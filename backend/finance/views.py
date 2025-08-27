from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment
from .serializers import PaymentSerializer
from common.permissions import IsAdminOrStaffOrReadOnly

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("application").all().order_by("-paid_at", "-id")
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["application", "currency", "method"]
