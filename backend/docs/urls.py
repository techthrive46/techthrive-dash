from rest_framework.routers import DefaultRouter

from .views import DocViewSet

router = DefaultRouter()
router.register("", DocViewSet, basename="doc")

urlpatterns = router.urls
