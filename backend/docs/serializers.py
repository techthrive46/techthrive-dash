import json

from rest_framework import serializers

from .models import Doc

MAX_CONTENT_BYTES = 2 * 1024 * 1024
EXCERPT_LENGTH = 240


class DocSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doc
        fields = ("id", "title", "content", "content_text", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_title(self, value):
        return value.strip() or "Untitled document"

    def validate_content(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Content must be a document object.")
        if value and value.get("type") != "doc":
            raise serializers.ValidationError("Content must be an editor document.")
        if len(json.dumps(value)) > MAX_CONTENT_BYTES:
            raise serializers.ValidationError("Document is too large (2 MB max).")
        return value


class DocListSerializer(serializers.ModelSerializer):
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Doc
        fields = ("id", "title", "excerpt", "created_at", "updated_at")

    def get_excerpt(self, doc):
        return " ".join(doc.content_text.split())[:EXCERPT_LENGTH]
