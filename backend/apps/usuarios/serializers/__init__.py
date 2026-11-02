"""Capa de esquema de CU1 · Seguridad y acceso + CU2 · Clientes.

Re-exporta los serializers para que `from apps.usuarios.serializers import ...`
siga funcionando igual.
"""
from apps.usuarios.serializers.acceso import (
    LoginSerializer,
    LogoutSerializer,
    RecuperarSerializer,
    RefreshSerializer,
    RegistroSerializer,
    RestablecerSerializer,
)
from apps.usuarios.serializers.auditoria import AuditoriaSerializer
from apps.usuarios.serializers.cliente import (
    ClientePreferenciaSerializer,
    ClienteSerializer,
    PerfilClienteSerializer,
)
from apps.usuarios.serializers.usuario import (
    FotoUsuarioSerializer,
    RolSerializer,
    UsuarioEquipoSerializer,
    UsuarioSerializer,
)

__all__ = [
    "AuditoriaSerializer",
    "ClientePreferenciaSerializer",
    "ClienteSerializer",
    "FotoUsuarioSerializer",
    "LoginSerializer",
    "LogoutSerializer",
    "PerfilClienteSerializer",
    "RecuperarSerializer",
    "RefreshSerializer",
    "RegistroSerializer",
    "RestablecerSerializer",
    "RolSerializer",
    "UsuarioEquipoSerializer",
    "UsuarioSerializer",
]
