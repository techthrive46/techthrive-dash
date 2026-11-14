from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Let an existing account approve and reject sign-ups (sets is_staff)."

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument(
            "--revoke", action="store_true", help="Take the admin role away instead."
        )

    def handle(self, email, revoke, **options):
        User = get_user_model()
        user = User.objects.filter(email__iexact=email.strip()).first()
        if user is None:
            raise CommandError(f"No account uses {email}. Register it first.")
        if revoke:
            user.is_staff = False
            user.save(update_fields=["is_staff"])
            self.stdout.write(self.style.SUCCESS(f"{user.email} is no longer an admin."))
            return
        user.is_staff = True
        user.is_active = True
        user.status = User.Status.APPROVED
        user.save(update_fields=["is_staff", "is_active", "status"])
        self.stdout.write(self.style.SUCCESS(f"{user.email} is now an admin."))
