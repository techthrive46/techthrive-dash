from datetime import date

from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from kanban.models import Card
from projects.access import accessible_boards, accessible_projects
from projects.models import Milestone, Project


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = accessible_projects(request.user)
        boards = accessible_boards(request.user)
        today = date.today()

        active_projects = projects.filter(status=Project.Status.ACTIVE).count()

        overdue_milestones = Milestone.objects.filter(
            project__in=projects,
            completed=False,
            target_date__lt=today,
        ).count()

        total_boards = boards.count()

        recent_cards = (
            Card.objects.filter(column__board__in=boards)
            .select_related("column", "column__board")
            .order_by("-updated_at")[:5]
        )

        return Response(
            {
                "active_projects": active_projects,
                "overdue_milestones": overdue_milestones,
                "total_boards": total_boards,
                "total_projects": projects.count(),
                "recent_activity": [
                    {
                        "id": str(card.id),
                        "title": card.title,
                        "board_id": str(card.column.board_id),
                        "board_title": card.column.board.title,
                        "column_name": card.column.name,
                        "updated_at": card.updated_at.isoformat(),
                    }
                    for card in recent_cards
                ],
            }
        )
