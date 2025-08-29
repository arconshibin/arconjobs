from django.core.management.base import BaseCommand
from django.db import transaction
from pathlib import Path
import json

from directory.models import Country

DEFAULT_FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "countries_with_dial_codes.json"

class Command(BaseCommand):
    help = "Load/refresh countries (code, name, dial_code) from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_FIXTURE))

    @transaction.atomic
    def handle(self, *args, **opts):
        path = Path(opts["file"])
        data = json.loads(path.read_text(encoding="utf-8"))
        upserts = 0
        for row in data:
            code = row["code"].upper().strip()
            defaults = {
                "name": row["name"].strip(),
                "dial_code": (row.get("dial_code") or "").strip() or None,
            }
            Country.objects.update_or_create(code=code, defaults=defaults)
            upserts += 1
        self.stdout.write(self.style.SUCCESS(f"Upserted {upserts} countries from {path.name}."))
