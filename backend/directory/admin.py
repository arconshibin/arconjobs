# directory/admin.py
from django.contrib import admin
from .models import Country

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "dial_code")
    search_fields = ("code", "name", "dial_code")
