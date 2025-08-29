# jobs/admin.py
from django.contrib import admin
from .models import Job, JobImage

class JobImageInline(admin.TabularInline):
    model = JobImage
    extra = 0

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title", "organization", "country", "status",
        "vacancies_initial", "vacancies_limit", "vacancies_filled",  # ← added
        "created_by", "updated_by", "created_at", "updated_at",
    )
    list_filter = ("status", "organization", "country")
    search_fields = ("title", "organization__name", "created_by__email", "updated_by__email")
    inlines = [JobImageInline]

@admin.register(JobImage)
class JobImageAdmin(admin.ModelAdmin):
    list_display = ("job", "caption", "uploaded_at")
