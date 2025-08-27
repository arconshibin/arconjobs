from rest_framework.routers import DefaultRouter
from .views import StatusViewSet, ApplicationViewSet, ApplicationEventViewSet, NoteViewSet

router = DefaultRouter()
router.register("statuses",     StatusViewSet,         basename="status")
router.register("applications", ApplicationViewSet,    basename="application")
router.register("events",       ApplicationEventViewSet, basename="application-event")
router.register("notes",        NoteViewSet,           basename="note")
urlpatterns = router.urls
