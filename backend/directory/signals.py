# directory/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Country
from .utils import country_name_for

@receiver([post_save, post_delete], sender=Country)
def _clear_country_cache(**kwargs):
    # Clear the LRU cache if any country is added/edited/removed
    country_name_for.cache_clear()
