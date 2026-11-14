import uuid

from django.contrib.auth import get_user_model
from django.db.models import Case, Count, IntegerField, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    CurrentUserSerializer,
    EmailTokenObtainPairSerializer,
    ManagedUserSerializer,
    RegisterSerializer,
    ReviewUserSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user


USER_SEARCH_MIN_LENGTH = 2
USER_SEARCH_LIMIT = 8


class UserSearchView(generics.ListAPIView):
    """Find accounts by email, e.g. to add someone to a project.

    `?q=` must be at least two characters so the full user list can't be
    paged out one letter at a time. `?project=<id>` leaves out people already
    on that project.
    """

    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        from projects.access import accessible_projects

        query = self.request.query_params.get("q", "").strip()
        if len(query) < USER_SEARCH_MIN_LENGTH:
            return User.objects.none()
        users = User.objects.filter(is_active=True, email__icontains=query).exclude(
            pk=self.request.user.pk
        )
        project_id = self.request.query_params.get("project")
        try:
            project_id = uuid.UUID(project_id) if project_id else None
        except ValueError:
            project_id = None
        if project_id:
            project = accessible_projects(self.request.user).filter(pk=project_id).first()
            if project is not None:
                users = users.exclude(pk=project.user_id).exclude(
                    pk__in=project.members.values("pk")
                )
        # Prefix matches first, then alphabetical.
        return sorted(
            users.order_by("email")[: USER_SEARCH_LIMIT * 4],
            key=lambda user: (not user.email.lower().startswith(query.lower()), user.email),
        )[:USER_SEARCH_LIMIT]


class LogoutView(APIView):
    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


# Admin: reviewing sign-ups ---------------------------------------------------


class ManagedUserListView(APIView):
    """Every account with its approval status, for admins (`is_staff`).

    `?status=pending|approved|rejected` narrows the list; `counts` always
    covers everyone so the page can label its filters. Pending accounts come
    first, newest first within each status.
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.select_related("reviewed_by")
        counts = dict(users.values_list("status").annotate(n=Count("id")).order_by())

        wanted = request.query_params.get("status")
        if wanted:
            if wanted not in User.Status.values:
                raise ValidationError({"status": f"Use one of: {', '.join(User.Status.values)}."})
            users = users.filter(status=wanted)
        query = request.query_params.get("q", "").strip()
        if query:
            users = users.filter(email__icontains=query)

        users = users.annotate(
            pending_first=Case(
                When(status=User.Status.PENDING, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("pending_first", "-date_joined")
        return Response(
            {
                "results": ManagedUserSerializer(users, many=True).data,
                "counts": {key: counts.get(key, 0) for key in User.Status.values},
            }
        )


class ReviewUserView(APIView):
    """Approve or reject an account: `{"status": "approved" | "rejected"}`.

    Either can be undone later. Rejecting cuts off an approved account at
    once: every API call checks `is_active`.
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        from notifications.models import WebSocketConnection

        user = get_object_or_404(User, pk=pk)
        serializer = ReviewUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        if user.pk == request.user.pk:
            raise ValidationError({"status": "You can't change your own access."})
        if new_status == User.Status.REJECTED and user.is_staff:
            raise ValidationError({"status": "Admins can't be rejected. Remove their admin role first."})

        user.status = new_status
        user.is_active = new_status == User.Status.APPROVED
        user.reviewed_by = request.user
        user.reviewed_at = timezone.now()
        user.save(update_fields=["status", "is_active", "reviewed_by", "reviewed_at"])
        if not user.is_active:
            WebSocketConnection.objects.filter(user=user).delete()
        return Response(ManagedUserSerializer(user).data)
