from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.usuarios.constants import (
    NOMBRE_ADMINISTRADOR,
    NOMBRE_AGENTE,
    NOMBRE_CLIENTE,
)

def rol_de(usuario) -> str | None:
    if not usuario or not usuario.is_authenticated:
        return None
    return getattr(getattr(usuario, "rol", None), "nombre", None)

class EsAdministrador(BasePermission):
    message = "Se requiere rol de administrador."

    def has_permission(self, request, view):
        return rol_de(request.user) == NOMBRE_ADMINISTRADOR

class EsPanel(BasePermission):
    message = "Se requiere rol de administrador o agente."

    def has_permission(self, request, view):
        return rol_de(request.user) in (NOMBRE_ADMINISTRADOR, NOMBRE_AGENTE)

class EsAdministradorOLectura(BasePermission):
    message = "Solo el administrador puede modificar este recurso."

    def has_permission(self, request, view):
        rol = rol_de(request.user)
        if request.method in SAFE_METHODS:
            return rol in (NOMBRE_ADMINISTRADOR, NOMBRE_AGENTE)
        return rol == NOMBRE_ADMINISTRADOR

class EsCliente(BasePermission):
    message = "Esta sección pertenece al área del viajero."

    def has_permission(self, request, view):
        return rol_de(request.user) == NOMBRE_CLIENTE
