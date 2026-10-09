from django.db import migrations

PHASE_KEYS = [
    "requirements",
    "design",
    "development",
    "testing",
    "deployment",
    "maintenance",
]


def backfill_phases(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    ProjectPhase = apps.get_model("projects", "ProjectPhase")

    phases = []
    for project in Project.objects.all():
        existing = set(
            ProjectPhase.objects.filter(project=project).values_list("key", flat=True)
        )
        phases.extend(
            ProjectPhase(project=project, key=key, order=index)
            for index, key in enumerate(PHASE_KEYS)
            if key not in existing
        )
    ProjectPhase.objects.bulk_create(phases)


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_sdlc_phases"),
    ]

    operations = [
        migrations.RunPython(backfill_phases, migrations.RunPython.noop),
    ]
