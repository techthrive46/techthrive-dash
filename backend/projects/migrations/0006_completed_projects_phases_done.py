from django.db import migrations


def mark_completed_projects_phases_done(apps, schema_editor):
    ProjectPhase = apps.get_model("projects", "ProjectPhase")
    ProjectPhase.objects.filter(project__status="completed").update(status="done")


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0005_backfill_project_phases"),
    ]

    operations = [
        migrations.RunPython(mark_completed_projects_phases_done, migrations.RunPython.noop),
    ]
