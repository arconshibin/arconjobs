from django.db import models


class Country(models.Model):
    code = models.CharField(primary_key=True, max_length=2)  # ISO-3166 alpha-2
    name = models.CharField(max_length=100)
    dial_code = models.CharField(max_length=6, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


