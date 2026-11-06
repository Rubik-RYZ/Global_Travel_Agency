"""Capa de negocio de CU1 · Seguridad y acceso + CU2 · Clientes.

Toda la lógica del dominio vive aquí: autenticación, registro de clientes,
recuperación de contraseña y bitácora de auditoría. Los ViewSets solo
orquestan (regla de capas de AGENT.md).

Este `__init__` re-exporta los servicios para que `from apps.usuarios import
services` siga funcionando igual.
"""
from apps.usuarios.services.acceso import (
    SALT_RECUPERACION,
    TOKEN_RECUPERACION_MAX_AGE,
    autenticar,
    cerrar_sesion,
    generar_tokens,
    registrar_cliente,
    restablecer_password,
    solicitar_recuperacion,
)
from apps.usuarios.services.auditoria import ip_desde_request, registrar_auditoria
from apps.usuarios.services.clientes import (
    CAMPOS_CLIENTE,
    actualizar_cliente,
    actualizar_preferencias_cliente,
    cliente_de_usuario,
    crear_cliente,
    eliminar_cliente,
    obtener_o_crear_cliente,
    obtener_preferencias,
)
from apps.usuarios.services.equipo import (
    actualizar_foto_usuario,
    actualizar_usuario_equipo,
    crear_usuario_equipo,
    desactivar_usuario_equipo,
)

__all__ = [
    "CAMPOS_CLIENTE",
    "SALT_RECUPERACION",
    "TOKEN_RECUPERACION_MAX_AGE",
    "actualizar_cliente",
    "actualizar_foto_usuario",
    "actualizar_preferencias_cliente",
    "actualizar_usuario_equipo",
    "autenticar",
    "cerrar_sesion",
    "cliente_de_usuario",
    "crear_cliente",
    "crear_usuario_equipo",
    "desactivar_usuario_equipo",
    "eliminar_cliente",
    "generar_tokens",
    "ip_desde_request",
    "obtener_o_crear_cliente",
    "obtener_preferencias",
    "registrar_auditoria",
    "registrar_cliente",
    "restablecer_password",
    "solicitar_recuperacion",
]
