from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.usuarios.constants import ROL_ADMINISTRADOR

ROL_AGENTE_ID = 2

class EsAdminOAgente(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.rol_id in (ROL_ADMINISTRADOR, ROL_AGENTE_ID)

class EsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.rol_id == ROL_ADMINISTRADOR)
