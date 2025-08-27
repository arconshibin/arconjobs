from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Status, Application, ApplicationEvent, Note
from .serializers import StatusSerializer, ApplicationSerializer, ApplicationEventSerializer, NoteSerializer
from common.permissions import IsAdminOrStaffOrReadOnly, IsSelfCandidateOrAdminStaff

class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all().order_by("code")
    serializer_class = StatusSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.select_related("candidate", "job", "owner").all().order_by("-created_at")
    serializer_class = ApplicationSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly | IsSelfCandidateOrAdminStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["current_status", "job", "candidate"]
    ordering_fields = ["created_at"]

class ApplicationEventViewSet(viewsets.ModelViewSet):
    queryset = ApplicationEvent.objects.select_related("application").all().order_by("-created_at")
    serializer_class = ApplicationEventSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["application", "type"]

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by("-created_at")
    serializer_class = NoteSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["application", "candidate"]
