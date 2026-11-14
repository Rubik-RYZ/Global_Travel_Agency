from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ia.models import ModeloIA
from apps.ia.serializers import (
    ModeloIASerializer,
    RecomendacionAdminSerializer,
    RecomendacionSerializer,
    RespuestaRecomendacionesSerializer,
)
from apps.ia.services.recomendaciones import (
    activar_modelo,
    aceptar_recomendacion,
    entrenar_recomendador,
    generar_recomendaciones,
    marcar_mostradas,
    resumen_admin,
    tiene_historial,
)
from apps.usuarios.models import ClientePreferencia
from apps.usuarios.permissions import EsAdministrador, EsCliente
from apps.usuarios.services.clientes import cliente_de_usuario

def _panel_recomendaciones_data() -> dict:
    datos = resumen_admin()
    return {
        "resumen": datos["resumen"],
        "por_paquete": datos["por_paquete"],
        "por_modelo": datos["por_modelo"],
        "recientes": RecomendacionAdminSerializer(
            datos["recientes"], many=True
        ).data,
        "modelo_activo": (
            ModeloIASerializer(datos["modelo_activo"]).data
            if datos["modelo_activo"]
            else None
        ),
        "modelos": ModeloIASerializer(datos["modelos"], many=True).data,
        "historial": datos["historial"],
    }

class RecomendacionesView(APIView):
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
                    "usa_historial": False,
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
                    "usa_historial": tiene_historial(cliente),
                }
            ).data
        )

class AceptarRecomendacionView(APIView):
    permission_classes = [EsCliente]

    def post(self, request, pk: int):
        cliente = cliente_de_usuario(request.user)
        if cliente is None:
            return Response({"detail": "No existe ficha de viajero."}, status=404)
        recomendacion = aceptar_recomendacion(cliente, pk)
        return Response(RecomendacionSerializer(recomendacion).data)

class PanelRecomendacionesView(APIView):
    permission_classes = [EsAdministrador]

    def get(self, request):
        return Response(_panel_recomendaciones_data())

class EntrenarRecomendadorView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request):
        entrenar_recomendador()
        return Response(_panel_recomendaciones_data())

class ActivarModeloRecomendadorView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request, pk: int):
        modelo = get_object_or_404(
            ModeloIA, pk=pk, tipo=ModeloIA.TIPO_RECOMENDADOR
        )
        activar_modelo(modelo)
        return Response(_panel_recomendaciones_data())
