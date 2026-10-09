from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    MilestoneCommentDetailView,
    MilestoneCommentListCreateView,
    MilestoneDetailView,
    MilestoneListCreateView,
    PhaseUpdateDetailView,
    PhaseUpdateListCreateView,
    ProjectPhaseDetailView,
    ProjectViewSet,
)

router = DefaultRouter()
router.register("", ProjectViewSet, basename="project")

urlpatterns = [
    path(
        "<uuid:project_id>/milestones/",
        MilestoneListCreateView.as_view(),
        name="project-milestones",
    ),
    path(
        "<uuid:project_id>/milestones/<uuid:milestone_id>/",
        MilestoneDetailView.as_view(),
        name="project-milestone-detail",
    ),
    path(
        "<uuid:project_id>/milestones/<uuid:milestone_id>/comments/",
        MilestoneCommentListCreateView.as_view(),
        name="project-milestone-comments",
    ),
    path(
        "<uuid:project_id>/milestones/<uuid:milestone_id>/comments/<uuid:comment_id>/",
        MilestoneCommentDetailView.as_view(),
        name="project-milestone-comment-detail",
    ),
    path(
        "<uuid:project_id>/phases/<slug:phase_key>/",
        ProjectPhaseDetailView.as_view(),
        name="project-phase-detail",
    ),
    path(
        "<uuid:project_id>/phases/<slug:phase_key>/updates/",
        PhaseUpdateListCreateView.as_view(),
        name="project-phase-updates",
    ),
    path(
        "<uuid:project_id>/phases/<slug:phase_key>/updates/<uuid:update_id>/",
        PhaseUpdateDetailView.as_view(),
        name="project-phase-update-detail",
    ),
    *router.urls,
]
