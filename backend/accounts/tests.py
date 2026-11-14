from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from notifications.models import Notification

User = get_user_model()

PASSWORD = "pw-correct-horse-42"


@override_settings(ALLOW_REGISTRATION=True)
class SignUpApprovalTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin@techthrivehq.com", PASSWORD, is_staff=True)
        self.teammate = User.objects.create_user("teammate@example.com", PASSWORD)

    def register(self, email="new@example.com"):
        return self.client.post("/api/auth/register/", {"email": email, "password": PASSWORD})

    def login(self, email="new@example.com", password=PASSWORD):
        return self.client.post("/api/auth/login/", {"email": email, "password": password})

    def review(self, user, new_status, as_user=None):
        self.client.force_authenticate(as_user or self.admin)
        response = self.client.post(f"/api/auth/admin/users/{user.pk}/review/", {"status": new_status})
        self.client.force_authenticate(None)
        return response

    def test_sign_up_waits_for_approval_and_notifies_admins(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "pending")

        user = User.objects.get(email="new@example.com")
        self.assertFalse(user.is_active)

        notifications = Notification.objects.filter(kind=Notification.Kind.USER_REGISTERED)
        self.assertEqual([n.recipient for n in notifications], [self.admin])
        self.assertEqual(notifications[0].actor, user)

    def test_pending_account_cannot_sign_in_and_is_told_why(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 401)
        self.assertIn("waiting for an admin", response.json()["detail"])

    def test_wrong_password_does_not_reveal_the_account(self):
        self.register()
        response = self.login(password="not-the-password")
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("waiting", response.json()["detail"])

    def test_approved_account_can_sign_in(self):
        self.register()
        user = User.objects.get(email="new@example.com")
        response = self.review(user, "approved")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reviewed_by"]["email"], self.admin.email)
        self.assertEqual(self.login().status_code, 200)

    def test_rejected_account_is_told_and_cut_off(self):
        self.register()
        user = User.objects.get(email="new@example.com")
        self.review(user, "approved")
        access = self.login().json()["access"]

        self.review(user, "rejected")
        self.assertIn("wasn't approved", self.login().json()["detail"])
        # Tokens issued before the rejection stop working too.
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_only_admins_can_list_and_review(self):
        self.register()
        user = User.objects.get(email="new@example.com")
        self.client.force_authenticate(self.teammate)
        self.assertEqual(self.client.get("/api/auth/admin/users/").status_code, 403)
        self.assertEqual(self.review(user, "approved", as_user=self.teammate).status_code, 403)

    def test_list_shows_pending_first_with_counts(self):
        self.register()
        self.client.force_authenticate(self.admin)
        data = self.client.get("/api/auth/admin/users/").json()
        self.assertEqual(data["results"][0]["email"], "new@example.com")
        self.assertEqual(data["counts"], {"pending": 1, "approved": 2, "rejected": 0})

        pending = self.client.get("/api/auth/admin/users/", {"status": "pending"}).json()
        self.assertEqual([u["email"] for u in pending["results"]], ["new@example.com"])
        self.assertEqual(self.client.get("/api/auth/admin/users/", {"status": "x"}).status_code, 400)

    def test_admins_cannot_lock_out_themselves_or_other_admins(self):
        other_admin = User.objects.create_user("other@techthrivehq.com", PASSWORD, is_staff=True)
        self.assertEqual(self.review(self.admin, "rejected").status_code, 400)
        self.assertEqual(self.review(other_admin, "rejected").status_code, 400)

    def test_me_says_who_is_an_admin(self):
        self.client.force_authenticate(self.admin)
        self.assertTrue(self.client.get("/api/auth/me/").json()["is_staff"])
        self.client.force_authenticate(self.teammate)
        self.assertFalse(self.client.get("/api/auth/me/").json()["is_staff"])

    def test_pending_accounts_cannot_be_found_or_added_to_projects(self):
        self.register()
        self.client.force_authenticate(self.teammate)
        self.assertEqual(self.client.get("/api/auth/users/", {"q": "new@"}).json(), [])


class FirstAccountTests(APITestCase):
    def test_first_account_on_an_empty_workspace_is_the_admin(self):
        response = self.client.post(
            "/api/auth/register/", {"email": "founder@example.com", "password": PASSWORD}
        )
        self.assertEqual(response.json()["status"], "approved")
        self.assertTrue(User.objects.get(email="founder@example.com").is_staff)


class GrantAdminCommandTests(APITestCase):
    def test_grant_and_revoke(self):
        user = User.objects.create_user("lead@example.com", PASSWORD)
        call_command("grant_admin", "LEAD@example.com", stdout=None)
        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        call_command("grant_admin", "lead@example.com", "--revoke", stdout=None)
        user.refresh_from_db()
        self.assertFalse(user.is_staff)
