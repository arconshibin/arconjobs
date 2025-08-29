# directory/utils.py
from functools import lru_cache
from typing import Optional
from .models import Country
from django.db.models import OuterRef, Subquery, QuerySet

@lru_cache(maxsize=512)
def country_name_for(code: Optional[str]) -> Optional[str]:
    """
    Map ISO-3166 alpha-2 code -> country name.
    Cached per-process; safe to call from serializers and templates.
    """
    if not code:
        return None
    return (
        Country.objects
        .filter(code=str(code).upper())
        .values_list("name", flat=True)
        .first()
    )

def annotate_country_name(qs: QuerySet, code_field: str = "country_code", out_field: str = "country_name") -> QuerySet:
    subq = Country.objects.filter(code=OuterRef(code_field)).values("name")[:1]
    return qs.annotate(**{out_field: Subquery(subq)})