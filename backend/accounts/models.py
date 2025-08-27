import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Organization(models.Model):
    PARTNER = "partner"   # (legacy 'agency')
    CLIENT = "client"     # (legacy 'employer')
    TYPES = [(PARTNER, "Partner"), (CLIENT, "Client")]

 # NEW: status choices
    STATUS_ACTIVE = "active"
    STATUS_SUSPENDED = "suspended"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_ARCHIVED, "Archived"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=16, choices=TYPES)
    name = models.CharField(max_length=200)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    tax_id = models.CharField(max_length=64, null=True, blank=True)
    phone = models.CharField(max_length=32, null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    added_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="organizations_added")

    created_at = models.DateTimeField(auto_now_add=True)  # "added time"
    updated_at = models.DateTimeField(auto_now=True)  

    class Meta:
        unique_together = (("type", "name"),)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Profile(models.Model):
    ADMIN = "admin"
    STAFF = "staff"
    MEMBER = "member"
    CANDIDATE = "candidate"
    ROLES = [(ADMIN, "Admin"), (STAFF, "Staff"), (MEMBER, "Member"), (CANDIDATE, "Candidate")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    organization = models.ForeignKey(
        Organization, null=True, blank=True, on_delete=models.SET_NULL, related_name="profiles"
    )
    role = models.CharField(max_length=16, choices=ROLES, default=MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="org_required_for_non_candidates",
                check=(
                    models.Q(role="candidate", organization__isnull=True)
                    | (~models.Q(role="candidate") & models.Q(organization__isnull=False))
                ),
            )
        ]

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


