from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.almacen import services
from apps.almacen.constants import (
    CARPETAS,
    CARPETAS_CLIENTE,
    ETIQUETAS_CARPETA,
    PREFIJOS_CLIENTE,
)
from apps.catalogo.permissions import EsAdminOAgente
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_AGENTE, ROL_CLIENTE

class EstadoAlmacenView(APIView):
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
    permission_classes = [IsAuthenticated]
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
        permitidas = (
            set(CARPETAS_CLIENTE)
            if request.user.rol_id == ROL_CLIENTE
            else set(CARPETAS)
        )
        if clave_carpeta not in permitidas:
            return Response(
                {
                    "carpeta": [
                        "Carpeta inválida. Opciones: "
                        + ", ".join(sorted(permitidas))
                        + "."
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
    permission_classes = [IsAuthenticated]

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
        del_panel = request.user.rol_id in (ROL_ADMINISTRADOR, ROL_AGENTE)
        permitido = public_id.startswith("illimani/") and (
            del_panel or public_id.startswith(PREFIJOS_CLIENTE)
        )
        if not permitido:
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
