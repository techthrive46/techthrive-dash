from django.contrib import admin

from .models import Board, Card, CardComment, Column


class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ("title", "key", "user", "updated_at")
    search_fields = ("title",)
    inlines = [ColumnInline]


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ("name", "board", "position")


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ("title", "number", "issue_type", "priority", "column", "updated_at")
    list_filter = ("issue_type", "priority")
    search_fields = ("title",)


@admin.register(CardComment)
class CardCommentAdmin(admin.ModelAdmin):
    list_display = ("card", "user", "created_at")
    search_fields = ("body", "card__title")
