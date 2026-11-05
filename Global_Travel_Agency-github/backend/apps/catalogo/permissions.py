"""Permisos del dominio de catálogo (CU3)."""
from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.usuarios.constants import ROL_ADMINISTRADOR

ROL_AGENTE_ID = 2  # Igual que en seed_data / constants


class EsAdminOAgente(BasePermission):
    """Solo administradores y agentes pueden escribir; lectura libre (incluso anónima)."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.rol_id in (ROL_ADMINISTRADOR, ROL_AGENTE_ID)


class EsAdmin(BasePermission):
    """Solo administradores (rol_id == ROL_ADMINISTRADOR)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.rol_id == ROL_ADMINISTRADOR)
