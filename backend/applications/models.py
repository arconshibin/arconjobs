import uuid
from django.db import models


class Status(models.Model):
    code = models.CharField(primary_key=True, max_length=32)  # e.g. APPLIED, SCREENING
    label = models.CharField(max_length=64)
    category = models.CharField(max_length=32, default="pipeline")


class Application(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey("candidates.Candidate", on_delete=models.CASCADE, related_name="applications")
    job = models.ForeignKey("jobs.Job", on_delete=models.CASCADE, related_name="applications")
    current_status = models.ForeignKey(Status, to_field="code", on_delete=models.PROTECT)
    source = models.CharField(max_length=64, null=True, blank=True)
    owner = models.ForeignKey("accounts.Profile", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["candidate", "job"], name="uniq_application_per_job")
        ]


class ApplicationEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="events")
    type = models.CharField(max_length=64)  # NOTE_ADDED, STATUS_CHANGED, DOC_UPLOADED
    payload = models.JSONField(default=dict)
    created_by = models.ForeignKey("accounts.Profile", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, null=True, blank=True, on_delete=models.CASCADE)
    candidate = models.ForeignKey("candidates.Candidate", null=True, blank=True, on_delete=models.CASCADE)
    body = models.TextField()
    created_by = models.ForeignKey("accounts.Profile", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


