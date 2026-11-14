from apps.usuarios.permissions import EsAdministrador

class EsAdministradorReportes(EsAdministrador):
    message = "Solo el administrador puede acceder a los reportes gerenciales."
