from django.contrib import admin
from .models import Candidate, CandidateSkill, CandidateExperience


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "passport_no", "nationality")


@admin.register(CandidateSkill)
class CandidateSkillAdmin(admin.ModelAdmin):
    list_display = ("candidate", "skill", "level", "created_at")


@admin.register(CandidateExperience)
class CandidateExperienceAdmin(admin.ModelAdmin):
    list_display = ("candidate", "employer", "role", "start_date", "end_date")


