"""Endpoints del almacén externo de archivos (Fase 3b)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.almacen import services
from apps.almacen.constants import CARPETAS, ETIQUETAS_CARPETA
from apps.catalogo.permissions import EsAdminOAgente


class EstadoAlmacenView(APIView):
    """GET /api/v1/almacen/estado/

    Permite al panel saber de antemano si la subida está disponible, para
    desactivar el botón y explicarlo en vez de fallar al intentarlo.
    """

    permission_classes = [EsAdminOAgente]

    def get(self, request):
        return Response(
            {
                "configurado": services.almacen_configurado(),
                "limite_mb": services.MAX_BYTES // (1024 * 1024),
                "formatos": sorted(services.FORMATOS_IMAGEN),
                "carpetas": [
                    {"clave": clave, "etiqueta": ETIQUETAS_CARPETA.get(clave, clave)}
                    for clave in CARPETAS
                ],
            }
        )


class SubidaArchivoView(APIView):
    """POST /api/v1/almacen/subir/  (multipart: `archivo`, `carpeta`)

    Devuelve la URL pública y el `public_id` del recurso. Si el entorno no
    tiene credenciales responde 503 con un mensaje explícito, nunca un 500.
    """

    permission_classes = [EsAdminOAgente]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not services.almacen_configurado():
            return Response(
                {
                    "code": "almacen_no_configurado",
                    "detail": (
                        "La subida de archivos no está configurada en este "
                        "entorno. Añada las credenciales CLOUDINARY_* al .env "
                        "para habilitarla."
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        archivo = request.FILES.get("archivo")
        if archivo is None:
            return Response(
                {"archivo": ["Adjunte un archivo en el campo «archivo»."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clave_carpeta = (request.data.get("carpeta") or "destinos").strip()
        if clave_carpeta not in CARPETAS:
            return Response(
                {
                    "carpeta": [
                        "Carpeta inválida. Opciones: " + ", ".join(CARPETAS) + "."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            datos = services.subir_imagen(
                archivo, carpeta=CARPETAS[clave_carpeta]
            )
        except DjangoValidationError as exc:
            return Response(
                getattr(exc, "message_dict", {"archivo": exc.messages}),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {**datos, "carpeta_clave": clave_carpeta},
            status=status.HTTP_201_CREATED,
        )


class EliminarArchivoView(APIView):
    """POST /api/v1/almacen/eliminar/  (JSON: `public_id`)

    Permite retirar del almacén la lámina que se reemplaza, de modo que la
    Media Library no acumule archivos huérfanos. Sólo se aceptan recursos del
    propio proyecto (prefijo `illimani/`).
    """

    permission_classes = [EsAdminOAgente]

    def post(self, request):
        if not services.almacen_configurado():
            return Response(
                {
                    "code": "almacen_no_configurado",
                    "detail": "El almacén externo no está configurado en este entorno.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        public_id = (request.data.get("public_id") or "").strip()
        if not public_id.startswith("illimani/"):
            return Response(
                {"public_id": ["Sólo se pueden retirar archivos del proyecto."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not services.eliminar_archivo(public_id):
            return Response(
                {"detail": "No se pudo retirar el archivo del almacén."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"public_id": public_id, "borrado": True})
