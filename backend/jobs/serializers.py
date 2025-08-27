from rest_framework import serializers
from .models import Job, JobImage, JobStatus


class JobImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobImage
        fields = ["id", "image", "caption", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class JobSerializer(serializers.ModelSerializer):
    images = JobImageSerializer(many=True, read_only=True)
    image_files = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def validate(self, attrs):
        mn, mx = attrs.get("salary_min"), attrs.get("salary_max")
        if mn is not None and mx is not None and mn > mx:
            raise serializers.ValidationError({"salary_min": "salary_min cannot be greater than salary_max."})
        if attrs.get("status") == JobStatus.DELETED:
            raise serializers.ValidationError({"status": "Only superadmin can delete jobs."})
        return attrs
