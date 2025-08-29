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
    country_name = serializers.CharField(source="country.name", read_only=True)

    vacancies_remaining = serializers.IntegerField(read_only=True)
    positions_filled = serializers.SerializerMethodField(read_only=True)

    def get_positions_filled(self, obj):
        return obj.vacancies_filled

    def to_representation(self, instance):
        """
        Add a read-only 'country_name' ONLY for list/retrieve.
        Uses select_related('country') from the viewset, so no extra queries.
        """
        data = super().to_representation(instance)
        view = self.context.get("view")
        if view and view.action in ("list", "retrieve"):
            country = getattr(instance, "country", None)
            data["country_name"] = getattr(country, "name", None) if country else None
        return data


    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by", "updated_by",
            # lock initial after create via update() logic (soft lock), still keep writable on create
            "vacancies_remaining", "positions_filled",
        ]

    
    def create(self, validated_data):
        # If user provides initial but not limit → default limit = initial.
        vi = validated_data.get("vacancies_initial")
        vl = validated_data.get("vacancies_limit")

        if vi is not None and vl is None:
            validated_data["vacancies_limit"] = vi
        elif vl is not None and vi is None:
            validated_data["vacancies_initial"] = vl

        validated_data.setdefault("vacancies_filled", 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Disallow changing initial after creation (professional guard)
        if "vacancies_initial" in validated_data and validated_data["vacancies_initial"] != instance.vacancies_initial:
            raise serializers.ValidationError({"vacancies_initial": "Cannot modify vacancies_initial after creation."})
        return super().update(instance, validated_data)

    def validate(self, attrs):
        mn, mx = attrs.get("salary_min"), attrs.get("salary_max")
        if mn is not None and mx is not None and mn > mx:
            raise serializers.ValidationError({"salary_min": "salary_min cannot be greater than salary_max."})
        if attrs.get("status") == JobStatus.DELETED:
            raise serializers.ValidationError({"status": "Only superadmin can delete jobs."})
    
        vi = attrs.get("vacancies_initial", getattr(self.instance, "vacancies_initial", None))
        vl = attrs.get("vacancies_limit", getattr(self.instance, "vacancies_limit", None))
        vf = attrs.get("vacancies_filled", getattr(self.instance, "vacancies_filled", 0))

        if vl is not None and vf is not None and vl < vf:
            raise serializers.ValidationError({"vacancies_limit": "vacancies_limit cannot be less than vacancies_filled."})
        if vi is not None and vi < 0:
            raise serializers.ValidationError({"vacancies_initial": "Must be >= 0."})
        return attrs
