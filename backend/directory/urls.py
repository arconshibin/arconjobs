from rest_framework.routers import DefaultRouter
from .views import CountryViewSet
router = DefaultRouter()
router.register("countries", CountryViewSet, basename="country")
urlpatterns = router.urls
