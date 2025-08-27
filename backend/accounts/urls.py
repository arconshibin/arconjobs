from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, ProfileViewSet, ClientViewSet

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("profiles",      ProfileViewSet,      basename="profile")
router.register("clients",       ClientViewSet,       basename="client")

urlpatterns = router.urls
