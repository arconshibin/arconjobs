from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Candidate, CandidateSkill, CandidateExperience
from .serializers import CandidateSerializer, CandidateSkillSerializer, CandidateExperienceSerializer
from common.permissions import IsAdminOrStaffOrReadOnly, IsSelfCandidateOrAdminStaff

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.select_related("profile", "nationality").all().order_by("-created_at")
    serializer_class = CandidateSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly | IsSelfCandidateOrAdminStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["nationality", "gender"]
    search_fields = ["first_name", "last_name", "email", "phone", "passport_no"]
    ordering_fields = ["created_at", "last_name"]

class CandidateSkillViewSet(viewsets.ModelViewSet):
    queryset = CandidateSkill.objects.all()
    serializer_class = CandidateSkillSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["candidate"]

class CandidateExperienceViewSet(viewsets.ModelViewSet):
    queryset = CandidateExperience.objects.all()
    serializer_class = CandidateExperienceSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["candidate"]
