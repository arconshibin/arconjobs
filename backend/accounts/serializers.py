# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Organization, Profile
class OrganizationSerializer(serializers.ModelSerializer):
    contact_user = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id", "type", "name", "country_code",
            "address", "tax_id", "phone", "status",
            "added_by", "created_at", "updated_at",
            "contact_user",
        ]
        read_only_fields = ["id", "type", "added_by", "created_at", "updated_at", "contact_user"]

    def get_contact_user(self, obj):
        # pick the first org admin as the primary contact
        p = obj.profiles.select_related("user").filter(role=Profile.ADMIN).order_by("created_at").first()
        if not p or not p.user:
            return None
        u = p.user
        return {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
        }

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active"]

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Profile
        fields = ["id", "user", "organization", "role", "created_at"]
