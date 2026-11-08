"""Endpoints del recomendador de paquetes (CU11)."""
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ia.serializers import (
    RecomendacionAdminSerializer,
    RecomendacionSerializer,
    RespuestaRecomendacionesSerializer,
)
from apps.ia.services.recomendaciones import (
    aceptar_recomendacion,
    generar_recomendaciones,
    marcar_mostradas,
    resumen_admin,
)
from apps.usuarios.models import ClientePreferencia
from apps.usuarios.permissions import EsAdministrador, EsCliente
from apps.usuarios.services.clientes import cliente_de_usuario


class RecomendacionesView(APIView):
    """Recomendaciones del viajero autenticado, persistidas en la BD."""

    permission_classes = [EsCliente]

    def get(self, request):
        cliente = cliente_de_usuario(request.user)
        if cliente is None:
            return Response(
                {
                    "modelo": None,
                    "preferencias": None,
                    "recomendaciones": [],
                    "generada_en": None,
                }
            )

        forzar = request.query_params.get("forzar") in ("true", "1")
        recomendaciones = generar_recomendaciones(cliente, forzar=forzar)
        marcar_mostradas(recomendaciones)

        preferencias = ClientePreferencia.objects.filter(cliente=cliente).first()
        modelo = recomendaciones[0].modelo if recomendaciones else None
        generada_en = max(
            (recomendacion.generada_en for recomendacion in recomendaciones),
            default=None,
        )

        return Response(
            RespuestaRecomendacionesSerializer(
                {
                    "modelo": modelo,
                    "preferencias": preferencias,
                    "recomendaciones": recomendaciones,
                    "generada_en": generada_en,
                }
            ).data
        )


class AceptarRecomendacionView(APIView):
    """Marca una recomendación como aceptada (clic en el paquete)."""

    permission_classes = [EsCliente]

    def post(self, request, pk: int):
        cliente = cliente_de_usuario(request.user)
        if cliente is None:
            return Response({"detail": "No existe ficha de viajero."}, status=404)
        recomendacion = aceptar_recomendacion(cliente, pk)
        return Response(RecomendacionSerializer(recomendacion).data)


class PanelRecomendacionesView(APIView):
    """Indicadores de calidad del recomendador para el administrador."""

    permission_classes = [EsAdministrador]

    def get(self, request):
        datos = resumen_admin()
        return Response(
            {
                "resumen": datos["resumen"],
                "por_paquete": datos["por_paquete"],
                "por_modelo": datos["por_modelo"],
                "recientes": RecomendacionAdminSerializer(
                    datos["recientes"], many=True
                ).data,
            }
        )
