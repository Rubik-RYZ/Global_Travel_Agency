"""Permisos del dominio 'reportes'."""
from apps.usuarios.permissions import EsAdministrador


class EsAdministradorReportes(EsAdministrador):
    """Los reportes gerenciales son exclusivos del administrador."""

    message = "Solo el administrador puede acceder a los reportes gerenciales."
