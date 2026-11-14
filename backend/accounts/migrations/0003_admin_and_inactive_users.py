"""Mark the team's admin mailbox as staff, so it can approve sign-ups.

Accounts that were already deactivated become "rejected", which is what the
users page shows for accounts that can't sign in.
"""

from django.db import migrations

ADMIN_EMAIL = "admin@techthrivehq.com"


def forwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(email__iexact=ADMIN_EMAIL).update(
        is_staff=True, is_active=True, status="approved"
    )
    User.objects.filter(is_active=False).update(status="rejected")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_user_approval_status"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
