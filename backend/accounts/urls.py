from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    LogoutView,
    ManagedUserListView,
    MeView,
    RegisterView,
    ReviewUserView,
    UserSearchView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("users/", UserSearchView.as_view(), name="auth-user-search"),
    path("admin/users/", ManagedUserListView.as_view(), name="auth-admin-users"),
    path("admin/users/<int:pk>/review/", ReviewUserView.as_view(), name="auth-admin-user-review"),
]
