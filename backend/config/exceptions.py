from rest_framework.views import exception_handler

def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:

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
