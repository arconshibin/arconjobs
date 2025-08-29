from rest_framework.routers import DefaultRouter
from .views import JobViewSet
router = DefaultRouter()
# Register with an empty prefix so when this module is included at
# path("api/jobs/", include("jobs.urls")) the endpoints become:
#   GET  /api/jobs/      -> list/root
#   POST /api/jobs/      -> create
#   GET  /api/jobs/{pk}/ -> retrieve
# This avoids the doubled "jobs/jobs" path.
router.register("", JobViewSet, basename="job")
urlpatterns = router.urls
