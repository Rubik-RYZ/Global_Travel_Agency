"""Rutas del dominio de usuarios (CU1 · seguridad y acceso).

Se usa router DRF para los recursos CRUD y rutas explícitas para los
endpoints de acceso (login/refresh/logout/registro/recuperación).
"""
from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.usuarios.views import (
    AuditoriaViewSet,
    ClienteViewSet,
    LoginView,
    LogoutView,
    MeView,
    MiPerfilView,
    MisPreferenciasView,
    RecuperarView,
    RefreshView,
    RegistroView,
    RestablecerView,
    RolViewSet,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register("roles", RolViewSet, basename="rol")
router.register("usuarios", UsuarioViewSet, basename="usuario")
router.register("auditoria", AuditoriaViewSet, basename="auditoria")
router.register("clientes", ClienteViewSet, basename="cliente")

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/registro", RegistroView.as_view(), name="auth-registro"),
    path("auth/recuperar", RecuperarView.as_view(), name="auth-recuperar"),
    path("auth/restablecer", RestablecerView.as_view(), name="auth-restablecer"),
    path("me/perfil", MiPerfilView.as_view(), name="me-perfil"),
    path("me/preferencias", MisPreferenciasView.as_view(), name="me-preferencias"),
    *router.urls,
]
