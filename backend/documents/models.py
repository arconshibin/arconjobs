import uuid
from django.db import models


class Document(models.Model):
    CANDIDATE = "candidate"
    APPLICATION = "application"
    OWNERS = [(CANDIDATE, "Candidate"), (APPLICATION, "Application")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_type = models.CharField(max_length=16, choices=OWNERS)
    owner_id = models.UUIDField()  # logical ref; validated in app layer
    kind = models.CharField(max_length=32)  # CV, PASSPORT, PHOTO, VIDEO
    storage_path = models.CharField(max_length=512)
    metadata = models.JSONField(default=dict)
    uploaded_by = models.ForeignKey("accounts.Profile", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


