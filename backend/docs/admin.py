from django.contrib import admin

from .models import Doc


@admin.register(Doc)
class DocAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "updated_at")
    search_fields = ("title", "content_text")
    readonly_fields = ("content",)
