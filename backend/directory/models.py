from django.db import models


class Country(models.Model):
    code = models.CharField(primary_key=True, max_length=2)  # ISO-3166 alpha-2
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.code})"


