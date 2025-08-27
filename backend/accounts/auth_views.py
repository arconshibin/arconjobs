# accounts/auth_views.py
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
# Blacklist support (installed via SIMPLE_JWT + token_blacklist app)
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import Profile

User = get_user_model()

# ---- Refresh cookie config (align PATH with where you mount /api/auth/*) ----
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_KW = {
    "httponly": True,
    "secure": not settings.DEBUG,   # True in prod with HTTPS
    "samesite": "Lax",              # use "None" if you truly must do cross-site requests over HTTPS
    "path": "/api/auth/",           # <<— IMPORTANT: this must match config/urls.py mount
    "max_age": 60 * 60 * 24 * 7,    # 7 days (matches your REFRESH lifetime)
}

def set_refresh_cookie(response: Response, refresh_str: str) -> None:
    response.set_cookie(REFRESH_COOKIE_NAME, refresh_str, **REFRESH_COOKIE_KW)

def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_KW["path"])


# =========================
# Login: set cookie + return access
# =========================
@method_decorator(csrf_exempt, name="dispatch")
class CookieTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/token/
    Body: { "username": "...", "password": "..." }
    Returns: { "access": "..." }
    Side-effect: sets httpOnly refresh cookie.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    def post(self, request, *args, **kwargs):
        resp: Response = super().post(request, *args, **kwargs)
        if resp.status_code != status.HTTP_200_OK:
            return resp

        # SimpleJWT returns {"refresh": "...", "access": "..."}
        data = resp.data or {}
        refresh = data.get("refresh")
        access = data.get("access")

        out = {}
        if access:
            out["access"] = access

        new_resp = Response(out, status=status.HTTP_200_OK)
        if refresh:
            set_refresh_cookie(new_resp, refresh)
        return new_resp


# =========================
# Refresh: read cookie if body missing, return new access, rotate cookie if enabled
# =========================
@method_decorator(csrf_exempt, name="dispatch")
class CookieTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Body: {}  (server will read httpOnly refresh cookie)
    Returns: { "access": "..." }
    Side-effect: if ROTATE_REFRESH_TOKENS, sets a new refresh cookie.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    def post(self, request, *args, **kwargs):
        # If client didn't send a refresh in body, pull it from cookie
        refresh_from_body = request.data.get("refresh")
        refresh_from_cookie = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_from_body and refresh_from_cookie:
            request.data["refresh"] = refresh_from_cookie

        resp: Response = super().post(request, *args, **kwargs)
        if resp.status_code != status.HTTP_200_OK:
            return resp

        data = resp.data or {}
        access = data.get("access")
        rotated_refresh = data.get("refresh")  # present if ROTATE_REFRESH_TOKENS = True

        out = {}
        if access:
            out["access"] = access

        new_resp = Response(out, status=status.HTTP_200_OK)
        # If rotation issued a new refresh, set it; otherwise keep cookie as-is
        if rotated_refresh:
            set_refresh_cookie(new_resp, rotated_refresh)
        return new_resp


# =========================
# Logout: blacklist current refresh and clear cookie
# =========================
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the current refresh token (if present) and clears the cookie.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_str = request.COOKIES.get(REFRESH_COOKIE_NAME)
        resp = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(resp)

        if not refresh_str:
            return resp  # nothing to blacklist

        try:
            refresh_obj = RefreshToken(refresh_str)
            # If rotation enabled, current refresh might still be valid; blacklist it
            if OutstandingToken and BlacklistedToken:
                token = OutstandingToken.objects.filter(jti=refresh_obj.get("jti")).first()
                if token and not BlacklistedToken.objects.filter(token=token).exists():
                    BlacklistedToken.objects.create(token=token, blacklisted_at=timezone.now())
        except TokenError:
            # Token invalid/expired – cookie cleared anyway
            pass

        return resp


# =========================
# Me: JWT-protected, return user + profile
# =========================
class MeView(APIView):
    """
    GET /api/me/
    Returns the authenticated user's basic info, admin flags, and (optional) profile.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user

        payload = {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
        }

        prof = getattr(u, "profile", None)
        if prof:
            org_id = str(prof.organization_id) if prof.organization_id else None
            payload["profile"] = {
                "id": str(prof.id),
                "role": prof.role,
                "organization": org_id,
            }
            # OPTIONAL org meta block – only include if org exists
            if prof.organization_id:
                org = prof.organization
                payload["profile"]["organization_meta"] = {
                    "id": str(org.id),
                    "name": org.name,
                    "type": org.type,
                    "status": org.status,
                }

        return Response(payload, status=status.HTTP_200_OK)