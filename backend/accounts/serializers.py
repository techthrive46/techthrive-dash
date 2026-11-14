from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import exceptions, serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

PENDING_MESSAGE = "Your account is waiting for an admin to approve it."
REJECTED_MESSAGE = "Your registration wasn't approved. Contact the TechThrive team if this is a mistake."


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        return token

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except exceptions.AuthenticationFailed:
            # Inactive accounts fail like a wrong password. Say why, but only
            # to someone who knows the password, so nobody can probe which
            # emails have signed up.
            user = User.objects.filter(email__iexact=attrs.get(self.username_field, "")).first()
            if user is not None and not user.is_active and user.check_password(attrs.get("password", "")):
                if user.status == User.Status.PENDING:
                    raise exceptions.AuthenticationFailed(PENDING_MESSAGE, code="account_pending")
                if user.status == User.Status.REJECTED:
                    raise exceptions.AuthenticationFailed(REJECTED_MESSAGE, code="account_rejected")
            raise


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "email", "password", "status")
        read_only_fields = ("status",)

    def validate(self, attrs):
        if not settings.ALLOW_REGISTRATION and User.objects.exists():
            raise serializers.ValidationError("Registration is disabled.")
        return attrs

    def create(self, validated_data):
        from notifications.services import notify_user_registered

        with transaction.atomic():
            # The very first account runs the workspace, so nobody has to
            # approve it. Everyone after waits for an admin.
            if not User.objects.exists():
                return User.objects.create_user(
                    **validated_data, status=User.Status.APPROVED, is_staff=True
                )
            user = User.objects.create_user(
                **validated_data, status=User.Status.PENDING, is_active=False
            )
            notify_user_registered(user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email")


class CurrentUserSerializer(serializers.ModelSerializer):
    """The signed-in user. `is_staff` decides who can review sign-ups."""

    class Meta:
        model = User
        fields = ("id", "email", "is_staff")


class ManagedUserSerializer(serializers.ModelSerializer):
    """An account as admins see it on the users page."""

    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "status",
            "is_staff",
            "date_joined",
            "last_login",
            "reviewed_by",
            "reviewed_at",
        )


class ReviewUserSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[User.Status.APPROVED, User.Status.REJECTED])
