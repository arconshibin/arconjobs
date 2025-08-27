from rest_framework.routers import DefaultRouter
from .views import CandidateViewSet, CandidateSkillViewSet, CandidateExperienceViewSet

router = DefaultRouter()
router.register("candidates",   CandidateViewSet,         basename="candidate")
router.register("skills",       CandidateSkillViewSet,    basename="candidate-skill")
router.register("experiences",  CandidateExperienceViewSet, basename="candidate-experience")
urlpatterns = router.urls
