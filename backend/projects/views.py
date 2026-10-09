from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Milestone, MilestoneComment, PhaseUpdate, Project, ProjectPhase
from .serializers import (
    MilestoneCommentSerializer,
    MilestoneSerializer,
    PhaseUpdateSerializer,
    ProjectListSerializer,
    ProjectPhaseSerializer,
    ProjectSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Project.objects.filter(user=self.request.user)
        if self.action == "list":
            return qs.annotate(
                milestone_count=Count("milestones"),
                completed_milestone_count=Count(
                    "milestones", filter=Q(milestones__completed=True)
                ),
                todo_milestone_count=Count(
                    "milestones",
                    filter=Q(milestones__bucket_status=Milestone.BucketStatus.TODO),
                ),
                in_progress_milestone_count=Count(
                    "milestones",
                    filter=Q(milestones__bucket_status=Milestone.BucketStatus.IN_PROGRESS),
                ),
                done_milestone_count=Count(
                    "milestones",
                    filter=Q(milestones__bucket_status=Milestone.BucketStatus.DONE),
                ),
            ).prefetch_related("phases")
        return qs.prefetch_related(
            "milestones",
            "board",
            Prefetch(
                "phases",
                queryset=ProjectPhase.objects.annotate(
                    update_count=Count("updates")
                ).order_by("order"),
            ),
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MilestoneListCreateView(generics.ListCreateAPIView):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.filter(
            project_id=self.kwargs["project_id"],
            project__user=self.request.user,
        )

    def perform_create(self, serializer):
        from kanban.sync import create_card_for_milestone

        project = Project.objects.get(
            id=self.kwargs["project_id"],
            user=self.request.user,
        )
        milestone = serializer.save(project=project)
        create_card_for_milestone(milestone)


class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "milestone_id"

    def get_queryset(self):
        return Milestone.objects.filter(
            project_id=self.kwargs["project_id"],
            project__user=self.request.user,
        )

    def perform_update(self, serializer):
        from kanban.sync import sync_milestone_card_content

        milestone = serializer.save()
        sync_milestone_card_content(milestone)


class MilestoneCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = MilestoneCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MilestoneComment.objects.filter(
            milestone_id=self.kwargs["milestone_id"],
            milestone__project_id=self.kwargs["project_id"],
            milestone__project__user=self.request.user,
        ).select_related("user")

    def perform_create(self, serializer):
        milestone = get_object_or_404(
            Milestone,
            id=self.kwargs["milestone_id"],
            project_id=self.kwargs["project_id"],
            project__user=self.request.user,
        )
        serializer.save(user=self.request.user, milestone=milestone)


class MilestoneCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MilestoneCommentSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "comment_id"

    def get_queryset(self):
        return MilestoneComment.objects.filter(
            milestone_id=self.kwargs["milestone_id"],
            milestone__project_id=self.kwargs["project_id"],
            milestone__project__user=self.request.user,
        ).select_related("user")

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ("GET", "HEAD", "OPTIONS") and obj.user_id != request.user.id:
            raise PermissionDenied("You can only edit your own comments.")


class ProjectPhaseDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectPhaseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "key"
    lookup_url_kwarg = "phase_key"

    def get_queryset(self):
        return ProjectPhase.objects.filter(
            project_id=self.kwargs["project_id"],
            project__user=self.request.user,
        ).annotate(update_count=Count("updates"))

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        phase = serializer.save()
        if phase.status != old_status:
            PhaseUpdate.objects.create(
                phase=phase,
                user=self.request.user,
                kind=PhaseUpdate.Kind.STATUS_CHANGE,
                body=(
                    f"{ProjectPhase.Status(old_status).label} → "
                    f"{ProjectPhase.Status(phase.status).label}"
                ),
            )
            phase.project.sync_status_from_phases()
        phase.update_count = phase.updates.count()


class PhaseUpdateListCreateView(generics.ListCreateAPIView):
    serializer_class = PhaseUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PhaseUpdate.objects.filter(
            phase__key=self.kwargs["phase_key"],
            phase__project_id=self.kwargs["project_id"],
            phase__project__user=self.request.user,
        ).select_related("user")

    def perform_create(self, serializer):
        phase = get_object_or_404(
            ProjectPhase,
            key=self.kwargs["phase_key"],
            project_id=self.kwargs["project_id"],
            project__user=self.request.user,
        )
        serializer.save(user=self.request.user, phase=phase)


class PhaseUpdateDetailView(generics.DestroyAPIView):
    serializer_class = PhaseUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "update_id"

    def get_queryset(self):
        return PhaseUpdate.objects.filter(
            phase__key=self.kwargs["phase_key"],
            phase__project_id=self.kwargs["project_id"],
            phase__project__user=self.request.user,
        )

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if obj.user_id != request.user.id:
            raise PermissionDenied("You can only delete your own updates.")
