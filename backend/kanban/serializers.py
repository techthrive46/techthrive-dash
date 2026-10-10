from accounts.serializers import UserSerializer
from rest_framework import serializers

from projects.access import accessible_boards, accessible_projects, board_users
from projects.models import Project

import re

from .models import Board, Card, CardComment, Column, DEFAULT_COLUMNS, DEFAULT_COLUMN_COLORS

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
BOARD_KEY_RE = re.compile(r"^[A-Z][A-Z0-9]{1,9}$")
MAX_LABELS = 10
MAX_LABEL_LENGTH = 30


class CardCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CardComment
        fields = ("id", "body", "user", "created_at", "updated_at")
        read_only_fields = ("id", "user", "created_at", "updated_at")


class CardSerializer(serializers.ModelSerializer):
    issue_key = serializers.CharField(read_only=True)
    assignee_email = serializers.EmailField(source="assignee.email", read_only=True, allow_null=True)
    comment_count = serializers.IntegerField(read_only=True, default=0)
    column_id = serializers.UUIDField(source="column.id", read_only=True)
    project_id = serializers.UUIDField(source="project.id", read_only=True, allow_null=True)
    milestone_id = serializers.UUIDField(source="milestone.id", read_only=True, allow_null=True)
    project_name = serializers.CharField(source="project.name", read_only=True, allow_null=True)

    class Meta:
        model = Card
        fields = (
            "id",
            "number",
            "issue_key",
            "issue_type",
            "title",
            "description",
            "priority",
            "due_date",
            "story_points",
            "labels",
            "assignee",
            "assignee_email",
            "comment_count",
            "column_entered_at",
            "completed_at",
            "position",
            "column",
            "column_id",
            "project",
            "project_id",
            "project_name",
            "milestone",
            "milestone_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "number",
            "milestone",
            "column_entered_at",
            "completed_at",
            "created_at",
            "updated_at",
        )

    def validate_column(self, column):
        user = self.context["request"].user
        if not accessible_boards(user).filter(pk=column.board_id).exists():
            raise serializers.ValidationError("Column not found.")
        if self.instance and column.board_id != self.instance.column.board_id:
            raise serializers.ValidationError("Issues can only move within their board.")
        return column

    def validate_assignee(self, assignee):
        if assignee is None:
            return assignee
        if self.instance is not None:
            board = self.instance.column.board
        else:
            board = self.context.get("board")
        if board is None or not board_users(board).filter(pk=assignee.pk).exists():
            raise serializers.ValidationError("Assignee must be someone with access to this board.")
        return assignee

    def validate_labels(self, labels):
        if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
            raise serializers.ValidationError("Labels must be a list of strings.")
        cleaned = []
        for label in labels:
            label = label.strip()
            if not label:
                continue
            if len(label) > MAX_LABEL_LENGTH:
                raise serializers.ValidationError(
                    f"Labels can be at most {MAX_LABEL_LENGTH} characters."
                )
            if label.lower() not in (existing.lower() for existing in cleaned):
                cleaned.append(label)
        if len(cleaned) > MAX_LABELS:
            raise serializers.ValidationError(f"An issue can have at most {MAX_LABELS} labels.")
        return cleaned

    def validate_project(self, project):
        if project is None:
            return project
        user = self.context["request"].user
        if not accessible_projects(user).filter(pk=project.pk).exists():
            raise serializers.ValidationError("Project not found.")
        return project


def validate_hex_color(value):
    if not HEX_COLOR_RE.match(value):
        raise serializers.ValidationError("Color must be a hex value like #0284c7.")
    return value.lower()


class ColumnSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = ("id", "name", "color", "position", "wip_limit", "cards")
        read_only_fields = ("id",)

    def validate_color(self, value):
        return validate_hex_color(value)


def validate_board_key(value):
    value = value.strip().upper()
    if not BOARD_KEY_RE.match(value):
        raise serializers.ValidationError(
            "Key must be 2-10 letters or digits and start with a letter."
        )
    return value


class LinkedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "status")


class BoardAccessFields(serializers.Serializer):
    """Owner and the viewer's role, shared by the list and detail serializers."""

    owner = UserSerializer(source="user", read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, board):
        return board.user_id == self.context["request"].user.id


class BoardListSerializer(BoardAccessFields, serializers.ModelSerializer):
    column_count = serializers.IntegerField(read_only=True)
    card_count = serializers.IntegerField(read_only=True)
    project_id = serializers.UUIDField(source="project.id", read_only=True, allow_null=True)

    class Meta:
        model = Board
        fields = (
            "id",
            "title",
            "key",
            "project",
            "project_id",
            "owner",
            "is_owner",
            "column_count",
            "card_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class BoardDetailSerializer(BoardAccessFields, serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    members = serializers.SerializerMethodField()
    project_id = serializers.UUIDField(source="project.id", read_only=True, allow_null=True)
    linked_projects = LinkedProjectSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = (
            "id",
            "title",
            "key",
            "project",
            "project_id",
            "linked_projects",
            "owner",
            "is_owner",
            "members",
            "columns",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_members(self, board):
        """Everyone who can be assigned issues on this board, owner included."""
        return UserSerializer(board_users(board), many=True).data

    def validate_key(self, value):
        return validate_board_key(value)

    def validate_project(self, project):
        if project is None:
            return project
        user = self.context["request"].user
        if not accessible_projects(user).filter(pk=project.pk).exists():
            raise serializers.ValidationError("Project not found.")
        return project


class BoardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ("id", "title", "key", "project")
        read_only_fields = ("id",)
        extra_kwargs = {"key": {"required": False}}

    def validate_key(self, value):
        return validate_board_key(value) if value else value

    def validate_project(self, project):
        if project is None:
            return project
        user = self.context["request"].user
        if not accessible_projects(user).filter(pk=project.pk).exists():
            raise serializers.ValidationError("Project not found.")
        return project

    def create(self, validated_data):
        board = Board.objects.create(**validated_data)
        for index, name in enumerate(DEFAULT_COLUMNS):
            Column.objects.create(
                board=board,
                name=name,
                position=index,
                color=DEFAULT_COLUMN_COLORS[index % len(DEFAULT_COLUMN_COLORS)],
            )
        return board


class ColumnCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ("id", "name", "color", "position", "wip_limit")
        read_only_fields = ("id",)

    def validate_color(self, value):
        return validate_hex_color(value)

    def validate(self, attrs):
        board = self.context["board"]
        if "position" not in attrs:
            max_pos = board.columns.order_by("-position").values_list("position", flat=True).first()
            attrs["position"] = (max_pos + 1) if max_pos is not None else 0
        if "color" not in attrs:
            attrs["color"] = DEFAULT_COLUMN_COLORS[attrs["position"] % len(DEFAULT_COLUMN_COLORS)]
        return attrs


class ReorderItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    position = serializers.IntegerField(min_value=0)


class ReorderSerializer(serializers.Serializer):
    columns = ReorderItemSerializer(many=True, required=False)
    cards = serializers.ListField(
        child=serializers.DictField(),
        required=False,
    )

    def validate_cards(self, value):
        for item in value:
            if "id" not in item or "column_id" not in item or "position" not in item:
                raise serializers.ValidationError(
                    "Each card must have id, column_id, and position."
                )
        return value
