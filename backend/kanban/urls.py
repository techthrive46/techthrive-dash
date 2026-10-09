from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CardCommentDetailView,
    CardCommentListCreateView,
    CardCreateView,
    CardDetailView,
    ColumnDetailView,
    ColumnListCreateView,
    BoardViewSet,
)

router = DefaultRouter()
router.register("", BoardViewSet, basename="board")

urlpatterns = [
    path("cards/", CardCreateView.as_view(), name="card-create"),
    path("cards/<uuid:pk>/", CardDetailView.as_view(), name="card-detail"),
    path(
        "cards/<uuid:card_id>/comments/",
        CardCommentListCreateView.as_view(),
        name="card-comments",
    ),
    path(
        "cards/<uuid:card_id>/comments/<uuid:comment_id>/",
        CardCommentDetailView.as_view(),
        name="card-comment-detail",
    ),
    path(
        "<uuid:board_id>/columns/",
        ColumnListCreateView.as_view(),
        name="board-columns",
    ),
    path(
        "<uuid:board_id>/columns/<uuid:column_id>/",
        ColumnDetailView.as_view(),
        name="board-column-detail",
    ),
    *router.urls,
]
