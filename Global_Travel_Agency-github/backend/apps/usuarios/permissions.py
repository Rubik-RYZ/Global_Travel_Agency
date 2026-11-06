"""Permisos por dominio (CU1 · seguridad y acceso).

Los permisos se derivan del rol del usuario (catálogo `roles`), no de
`auth_permission`. El rol administrador concentra la gestión de equipo,
roles y bitácora; el agente comparte la operación del panel.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.usuarios.constants import (
    NOMBRE_ADMINISTRADOR,
    NOMBRE_AGENTE,
    NOMBRE_CLIENTE,
)


def rol_de(usuario) -> str | None:
    """Nombre del rol del usuario o None si no está autenticado."""
    if not usuario or not usuario.is_authenticated:
        return None
    return getattr(getattr(usuario, "rol", None), "nombre", None)


class EsAdministrador(BasePermission):
    """Solo el rol `administrador`."""

    message = "Se requiere rol de administrador."

    def has_permission(self, request, view):
        return rol_de(request.user) == NOMBRE_ADMINISTRADOR


class EsPanel(BasePermission):
    """Administrador o agente (acceso al panel interno)."""

    message = "Se requiere rol de administrador o agente."

    def has_permission(self, request, view):
        return rol_de(request.user) in (NOMBRE_ADMINISTRADOR, NOMBRE_AGENTE)


class EsAdministradorOLectura(BasePermission):
    """Lectura para el panel; escritura solo para el administrador."""

    message = "Solo el administrador puede modificar este recurso."

    def has_permission(self, request, view):
        rol = rol_de(request.user)
        if request.method in SAFE_METHODS:
            return rol in (NOMBRE_ADMINISTRADOR, NOMBRE_AGENTE)
        return rol == NOMBRE_ADMINISTRADOR


class EsCliente(BasePermission):
    """Solo el rol `cliente` (área privada «Mi viaje»)."""

    message = "Esta sección pertenece al área del viajero."

    def has_permission(self, request, view):
        return rol_de(request.user) == NOMBRE_CLIENTE
