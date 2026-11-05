"""Handler global de excepciones DRF.

Garantiza que toda respuesta de error de la API tenga la forma:
    { "error": "<mensaje>", "code": "<código>" }
y conserva el detalle original (validaciones por campo) en `detail`.
"""
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Excepción no manejada por DRF: dejar que Django la procese.
        return None

    data = response.data
    code = getattr(exc, "default_code", None) or exc.__class__.__name__.lower()

    if isinstance(data, dict) and set(data.keys()) == {"detail"}:
        message = str(data["detail"])
    elif isinstance(data, list) and data:
        message = str(data[0])
    elif isinstance(data, dict):
        message = "Error de validación."
    else:
        message = str(data)

    response.data = {"error": message, "code": code, "detail": data}
    return response
