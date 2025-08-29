from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.decorators.csrf import csrf_exempt
from accounts.auth_views import LogoutView, MeView

from django.conf import settings

from django.conf.urls.static import static


    
urlpatterns = [



    # App routers
    path("api/accounts/",     include("accounts.urls")),
    path("api/directory/",    include("directory.urls")),
    path("api/candidates/",   include("candidates.urls")),
    path("api/jobs/",         include("jobs.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/documents/",    include("documents.urls")),
    path("api/finance/",      include("finance.urls")),

    # Additional routes
        # Stateless JWT endpoints (no refresh cookie) — frontend should persist refresh locally
        path("api/auth/token/",   csrf_exempt(TokenObtainPairView.as_view()), name="token_obtain_pair"),
         path("api/auth/refresh/", csrf_exempt(TokenRefreshView.as_view()),    name="token_refresh"),
    path("api/auth/logout/",  LogoutView.as_view(),                name="logout"),
    path("api/me/",           MeView.as_view(),                    name="me"),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)