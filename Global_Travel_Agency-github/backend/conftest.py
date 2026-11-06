"""Configuración común de la suite de pruebas (pytest).

Los tests nunca deben salir a la red ni gastar cuota de los servicios
externos: aquí se dejan Resend y Cloudinary **apagados por defecto**, como en
un entorno recién clonado. Cada prueba que necesite simular credenciales las
activa explícitamente con el fixture `settings`.
"""
import pytest


@pytest.fixture(autouse=True)
def _sin_servicios_externos(settings):
    settings.RESEND_API_KEY = ""
    settings.CORREO_CONFIGURADO = False
    settings.CLOUDINARY_CLOUD_NAME = ""
    settings.CLOUDINARY_API_KEY = ""
    settings.CLOUDINARY_API_SECRET = ""
    settings.ALMACEN_CONFIGURADO = False
    return settings
