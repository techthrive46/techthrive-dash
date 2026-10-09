import uuid

from django.conf import settings
from django.db import models


class Doc(models.Model):
    """A rich-text document. `content` is the editor's (Tiptap/ProseMirror) JSON."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="docs",
    )
    title = models.CharField(max_length=255, default="Untitled document")
    content = models.JSONField(default=dict, blank=True)
    # Plain-text copy of the content, sent by the editor, for search and previews.
    content_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title
