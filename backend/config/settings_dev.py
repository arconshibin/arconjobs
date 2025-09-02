from .settings import *  # brings in base settings incl. SECRET_KEY, DEBUG, etc.
import os
from datetime import timedelta

# --- SECRET KEY (use your env DJANGO_SECRET_KEY if present) ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", SECRET_KEY)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# --- Helper to avoid duplicate apps ---
def _add_apps(apps):
    for a in apps:
        if a not in INSTALLED_APPS:
            INSTALLED_APPS.append(a)

# --- Apps (project + libs, de-duplicated) ---
_add_apps([
    # project apps
    "accounts", "directory", "candidates", "jobs", "applications", "documents", "finance",
    # libs
    "rest_framework", "drf_spectacular", "django_filters",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
])

# --- Middleware (put corsheaders first once) ---
if "corsheaders.middleware.CorsMiddleware" not in MIDDLEWARE:
    MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware"] + list(MIDDLEWARE)

# --- CORS/CSRF for localhost dev ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:5173",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost",
    "http://localhost:5173",
]

# --- DRF ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # Enable SessionAuthentication only if you plan to use Django admin login for API browsing:
        # "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "arconjobs-v2 API",
    "VERSION": "1.0.0",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
}

# --- SimpleJWT (sign with Django SECRET_KEY) ---
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,     # <-- FIX: use SECRET_KEY, not DJANGO_SECRET_KEY
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- DB (Docker backend -> host Supabase Postgres) ---
DATABASES = {
    "default": dj_database_url.parse(
        os.environ.get("DATABASE_URL"),
        conn_max_age=0,   # <-- important for PgBouncer "transaction" pooling
    )
}

CONN_MAX_AGE = 0 