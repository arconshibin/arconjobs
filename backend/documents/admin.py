from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("owner_type", "owner_id", "kind", "uploaded_by", "created_at")


