from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import ValidationError

from accounts.models import Organization
from .models import Job, JobImage, JobStatus
from .serializers import JobSerializer


def user_org(user):
    prof = getattr(user, "profile", None)
    return getattr(prof, "organization", None)


def is_client_user(user):
    prof = getattr(user, "profile", None)
    if not prof or not prof.organization:
        return False
    return prof.organization.type == Organization.CLIENT  # "client"


class CanCreateJob(BasePermission):
    """Allow POST only for client users, staff, or superusers."""
    def has_permission(self, request, view):
        if request.method != "POST":
            return True
        u = request.user
        return u.is_authenticated and (u.is_superuser or u.is_staff or is_client_user(u))


class SuperuserHardDeleteOnly(BasePermission):
    """Only superuser may hard DELETE."""
    def has_permission(self, request, view):
        if request.method != "DELETE":
            return True
        return bool(request.user and request.user.is_superuser)


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [CanCreateJob, SuperuserHardDeleteOnly]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["organization", "status", "country"]
    search_fields = ["title", "organization__name","country__name"]
    ordering_fields = ["created_at", "title"]

    def get_queryset(self):
        u = self.request.user

        # Staff/superuser: see all (except deleted)
        if u.is_authenticated and (u.is_staff or u.is_superuser):
            return Job.objects.select_related("organization", "country") \
                .exclude(status=JobStatus.DELETED).order_by("-created_at")

        # Clients: only their org (never others'), excluding deleted
        org = user_org(u)
        if u.is_authenticated and org:
            return Job.objects.select_related("organization", "country") \
                .filter(organization=org).exclude(status=JobStatus.DELETED) \
                .order_by("-created_at")

        return Job.objects.none()

    def perform_create(self, serializer):
        """
        - Client users: force organization = their own org.
        - Staff/superuser: must provide organization in payload (acting for client).
        - Stamp created_by/updated_by from request.user.
        - Save image_files if provided.
        """
        u = self.request.user
        imgs = self.request.FILES.getlist("image_files")

        if u.is_staff or u.is_superuser:
            org = serializer.validated_data.get("organization")
            if not org:
                raise ValidationError({"organization": "This field is required for staff/admin creates."})
            job = serializer.save(created_by=u, updated_by=u)
        else:
            org = user_org(u)
            if not org:
                raise ValidationError({"organization": "Your account has no organization; contact support."})
            job = serializer.save(organization=org, created_by=u, updated_by=u)

        for f in imgs:
            JobImage.objects.create(job=job, image=f)

    def perform_update(self, serializer):
        u = self.request.user
        if serializer.initial_data.get("status") == JobStatus.DELETED and not u.is_superuser:
            raise ValidationError({"status": "Only superadmin can delete jobs."})

        job = serializer.save(updated_by=u)

        imgs = self.request.FILES.getlist("image_files")
        for f in imgs:
            JobImage.objects.create(job=job, image=f)
