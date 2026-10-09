from django.contrib import admin

from .models import Milestone, MilestoneComment, PhaseUpdate, Project, ProjectPhase


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0


class ProjectPhaseInline(admin.TabularInline):
    model = ProjectPhase
    extra = 0
    fields = ("key", "status", "notes")
    readonly_fields = ("key",)
    can_delete = False


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "user", "due_date", "updated_at")
    list_filter = ("status",)
    search_fields = ("name",)
    inlines = [ProjectPhaseInline, MilestoneInline]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "target_date", "completed")
    list_filter = ("completed",)


@admin.register(MilestoneComment)
class MilestoneCommentAdmin(admin.ModelAdmin):
    list_display = ("milestone", "user", "created_at")
    search_fields = ("body", "milestone__title", "user__email")


@admin.register(PhaseUpdate)
class PhaseUpdateAdmin(admin.ModelAdmin):
    list_display = ("phase", "kind", "user", "created_at")
    list_filter = ("kind",)
    search_fields = ("body", "phase__project__name")
