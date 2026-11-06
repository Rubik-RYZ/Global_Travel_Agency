"""Capa de negocio del correo transaccional.

Re-exporta la API pública para que `from apps.notificaciones import services`
siga funcionando igual.
"""
from apps.notificaciones.services.envio import (
    bienvenida_cliente,
    correo_configurado,
    enviar,
    ficha_viajero_abierta,
    password_restablecido,
    recuperacion_password,
)

__all__ = [
    "bienvenida_cliente",
    "correo_configurado",
    "enviar",
    "ficha_viajero_abierta",
    "password_restablecido",
    "recuperacion_password",
]
