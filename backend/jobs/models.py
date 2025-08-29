# jobs/models.py
import uuid
from django.conf import settings
from django.db import models,transaction
from django.db.models import Q, F
from django.core.exceptions import ValidationError


class JobStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    DELETED = "deleted", "Deleted"


class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Ownership anchor
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="jobs",
    )

    # Audit (non-nullable)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="jobs_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="jobs_updated",
    )

    # Job details
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    salary_min = models.IntegerField(null=True, blank=True)
    salary_max = models.IntegerField(null=True, blank=True)
    currency = models.CharField(max_length=3, null=True, blank=True)
    country = models.ForeignKey(
        "directory.Country", null=True, blank=True, on_delete=models.SET_NULL
    )

    status = models.CharField(
        max_length=24, choices=JobStatus.choices, default=JobStatus.ACTIVE
    )
    vacancies_initial = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Original announced openings at create time."
    )
    vacancies_limit = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Current cap of openings allowed to be filled."
    )
    vacancies_filled = models.PositiveIntegerField(
        default=0,
        help_text="System counter incremented on submit, decremented on reject/withdraw."
    )
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["created_at"]),
        ]
        constraints = [
            # Non-negative guards (allow null for initial/limit)
            models.CheckConstraint(
                check=Q(vacancies_initial__gte=0) | Q(vacancies_initial__isnull=True),
                name="job_vac_initial_nonneg",
            ),
            models.CheckConstraint(
                check=Q(vacancies_limit__gte=0) | Q(vacancies_limit__isnull=True),
                name="job_vac_limit_nonneg",
            ),
            models.CheckConstraint(
                check=Q(vacancies_filled__gte=0),
                name="job_vac_filled_nonneg",
            ),
            # When both set, limit must be >= filled
            models.CheckConstraint(
                check=Q(vacancies_limit__isnull=True) | Q(vacancies_limit__gte=F("vacancies_filled")),
                name="job_vac_limit_gte_filled",
            ),
        ]

    def __str__(self):
        return f"{self.title} ({self.organization_id})"
    
    @property
    def vacancies_remaining(self):
        if self.vacancies_limit is None:
            return None
        return max(0, self.vacancies_limit - self.vacancies_filled)

    # Atomic helpers
    @transaction.atomic
    def reserve_slots(self, n=1):
        """
        Increment 'filled' by n if it won't exceed the current limit.
        If limit is None (unspecified), allow reservations without a cap.
        """
        if self.vacancies_limit is None:
            Job.objects.filter(pk=self.pk).update(vacancies_filled=F("vacancies_filled") + n)
            return True

        updated = Job.objects.filter(
            pk=self.pk,
            vacancies_filled__lte=F("vacancies_limit") - n
        ).update(vacancies_filled=F("vacancies_filled") + n)

        if not updated:
            raise ValidationError("No vacancies left for this job.")
        return True

    @transaction.atomic
    def release_slots(self, n=1):
        """
        Decrement 'filled' by n (cannot go below zero).
        """
        updated = Job.objects.filter(
            pk=self.pk,
            vacancies_filled__gte=n
        ).update(vacancies_filled=F("vacancies_filled") - n)

        if not updated:
            raise ValidationError("Cannot release more slots than reserved.")
        return True


class JobImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="job-images/%Y/%m/")  # needs Pillow
    caption = models.CharField(max_length=200, blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.job_id}"
