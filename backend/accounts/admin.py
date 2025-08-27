from django.contrib import admin
from .models import Organization, Profile


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "country_code", "created_at")
    list_filter = ("type",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "organization", "created_at")
    list_filter = ("role",)


