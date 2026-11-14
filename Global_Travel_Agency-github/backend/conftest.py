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
