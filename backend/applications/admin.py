from django.contrib import admin
from .models import Status, Application, ApplicationEvent, Note


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "category")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("candidate", "job", "current_status", "owner", "created_at")


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    list_display = ("application", "type", "created_by", "created_at")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("candidate", "application", "created_by", "created_at")


