import re

from django.db import migrations


def derive_board_key(title):
    # Frozen copy of kanban.models.derive_board_key, so later edits don't change this migration.
    words = re.findall(r"[A-Za-z0-9]+", title)
    if len(words) >= 2:
        key = "".join(word[0] for word in words[:4])
    elif words:
        key = words[0][:3]
    else:
        key = ""
    key = key.upper()
    return key if len(key) >= 2 else (key + "BRD")[:3]


def backfill(apps, schema_editor):
    Board = apps.get_model("kanban", "Board")
    Card = apps.get_model("kanban", "Card")

    for board in Board.objects.all():
        cards = Card.objects.filter(column__board=board).order_by("created_at", "id")
        counter = 0
        for card in cards:
            counter += 1
            card.number = counter
            card.save(update_fields=["number"])
        board.issue_counter = counter
        if not board.key:
            board.key = derive_board_key(board.title)
        board.save(update_fields=["issue_counter", "key"])


class Migration(migrations.Migration):

    dependencies = [
        ("kanban", "0007_jira_issues"),
    ]

    operations = [
        migrations.RunPython(backfill, migrations.RunPython.noop),
    ]
