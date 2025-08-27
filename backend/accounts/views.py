# accounts/views.py
from rest_framework import viewsets, permissions, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from django.db import transaction
from django.utils.text import slugify
from django.contrib.auth.models import User
import secrets, string
from rest_framework.decorators import action

from .models import Organization, Profile
from .serializers import OrganizationSerializer, ProfileSerializer
from common.permissions import IsAdminOrStaffOrReadOnly, IsSuperuserOrStaff
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required

# --- Organizations (all types) ---
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all().order_by("name")
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperuserOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["type", "country_code", "status"]
    search_fields = ["name", "tax_id", "phone"]
    ordering_fields = ["name", "created_at"]

# helpers
def _generate_username(base: str) -> str:
    base_slug = slugify(base) or "user"
    username = base_slug
    i = 1
    while User.objects.filter(username=username).exists():
        i += 1
        username = f"{base_slug}{i}"
    return username

def _generate_password(n: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))

# --- Clients (type='client') ---
class ClientViewSet(viewsets.ModelViewSet):
    """
    CRUD for Organization rows where type='client'.
    JWT-only (no SessionAuth). Read allowed to authenticated users,
    write allowed to admins/staff per IsAdminOrStaffOrReadOnly.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperuserOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["country_code", "status"]
    search_fields = [
        "name", "tax_id", "phone",
        "profiles__user__email", "profiles__user__username",
        "profiles__user__first_name", "profiles__user__last_name",
    ]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return (
            Organization.objects
            .filter(type=Organization.CLIENT)
            .prefetch_related("profiles__user")
            .order_by("name")
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        print("create")
        # Validate incoming fields against OrganizationSerializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save org with locked type and added_by
        org: Organization = serializer.save(
            type=Organization.CLIENT,
            added_by=request.user,  # field must exist in your model
        )

        # Optional contact person block
        contact = request.data.get("contact_person") or {}
        first_name = (contact.get("first_name") or "").strip()
        last_name  = (contact.get("last_name") or "").strip()
        email      = (contact.get("email") or "").strip()
        username   = (contact.get("username") or "").strip()
        password   = (contact.get("password") or "").strip()

        created_user = None
        temp_password = None

        # Create contact login if any contact detail provided
        if first_name or last_name or email or username or password:
            if not username:
                base = (first_name + last_name) or org.name
                username = _generate_username(base)
            if not password:
                temp_password = _generate_password()

            created_user = User.objects.create_user(
                username=username,
                email=email,
                password=password or temp_password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
            )
            # Make them org admin
            Profile.objects.create(user=created_user, organization=org, role=Profile.ADMIN)

        # Re-serialize the persisted org
        data = self.get_serializer(org).data

        # Attach transient info (contact user + temp password) to response only
        if created_user:
            data["contact_user"] = {
                "id": created_user.id,
                "username": created_user.username,
                "email": created_user.email,
                "first_name": created_user.first_name,
                "last_name": created_user.last_name,
            }
            if temp_password:
                data["temp_password"] = temp_password

        # IMPORTANT: return the object directly (no {"returnedData": ...} wrapper)
        return Response(data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        # Keep type locked; preserve added_by
        serializer.save(type=Organization.CLIENT)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        # 1) Guard: only superusers can hard-delete
        if not request.user.is_superuser:
            return Response(
                {"error": "Only admins can permanently delete clients."},
                status=status.HTTP_403_FORBIDDEN,
            )

        org = self.get_object()

        # 2) Deactivate contact user(s) (ADMIN profiles) so they can't log in
        admin_profiles = (
            org.profiles.select_related("user")
            .filter(role=Profile.ADMIN, user__isnull=False)
        )

        deactivated = 0
        for prof in admin_profiles:
            user = prof.user
            if user.is_active:
                user.is_active = False
                user.save(update_fields=["is_active"])
                deactivated += 1

        # 3) Proceed with hard delete
        response = super().destroy(request, *args, **kwargs)

        # Optional: If you want to return info (instead of default 204),
        # change to return a 200 with payload. Otherwise keep DRF's 204.
        # Example (uncomment to return JSON):
        # return Response(
        #     {"message": "Client deleted.", "deactivated_contact_users": deactivated},
        #     status=status.HTTP_200_OK,
        # )

        return response

    @action(detail=True, methods=["post"], url_path="reset-contact-password")
    def reset_contact_password(self, request, pk=None):
        org = self.get_object()
        prof = org.profiles.select_related("user").filter(role=Profile.ADMIN).first()
        if not prof or not prof.user:
            return Response({"error": "No contact user found for this client."}, status=status.HTTP_400_BAD_REQUEST)

        user = prof.user
        new_password = (request.data.get("password") or "").strip() or _generate_password()
        user.set_password(new_password)
        user.save()

        return Response({
            "returnedData": {
                "contact_user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "temp_password": new_password,
            }
        }, status=status.HTTP_200_OK)
# --- Profiles (read-only) ---
class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.select_related("user", "organization").all().order_by("-created_at")
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["role", "organization__type"]
    search_fields = ["user__username", "user__email"]
    ordering_fields = ["created_at"]

@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})

@login_required
def me_view(request):
    user = request.user
    return JsonResponse({"username": user.username, "email": user.email})
