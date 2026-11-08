"""Panel de entrenamiento del asistente conversacional (CU10)."""
from django.db.models import ProtectedError
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ia.models import FraseEntrenamiento, Intencion
from apps.ia.serializers import (
    FraseEntrenamientoSerializer,
    IntencionAdminSerializer,
    ModeloIASerializer,
)
from apps.ia.services.entrenamiento import (
    listar_intenciones,
    reentrenar_clasificador,
    resumen_entrenamiento,
)
from apps.usuarios.permissions import EsAdministrador


class _ReentrenarAlGuardar:
    """Mantiene el clasificador sincronizado con los cambios del catálogo."""

    def _reentrenar(self):
        reentrenar_clasificador()

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self._reentrenar()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self._reentrenar()

    def perform_destroy(self, instance):
        try:
            super().perform_destroy(instance)
        except ProtectedError as exc:
            raise ValidationError(
                {
                    "detail": (
                        "No se puede eliminar: la intención tiene conversaciones "
                        "asociadas. Desactívela en su lugar."
                    )
                }
            ) from exc
        self._reentrenar()


class IntencionViewSet(_ReentrenarAlGuardar, viewsets.ModelViewSet):
    """CRUD de intenciones para el administrador."""

    permission_classes = [EsAdministrador]
    serializer_class = IntencionAdminSerializer
    pagination_class = None

    def get_queryset(self):
        return listar_intenciones()


class FraseEntrenamientoViewSet(_ReentrenarAlGuardar, viewsets.ModelViewSet):
    """CRUD de frases etiquetadas para el administrador."""

    permission_classes = [EsAdministrador]
    serializer_class = FraseEntrenamientoSerializer
    pagination_class = None

    def get_queryset(self):
        qs = FraseEntrenamiento.objects.select_related("intencion")
        intencion_id = self.request.query_params.get("intencion")
        if intencion_id:
            qs = qs.filter(intencion_id=intencion_id)
        texto = self.request.query_params.get("q")
        if texto:
            qs = qs.filter(texto__icontains=texto)
        return qs.order_by("intencion__nombre", "id")


def _panel_serializado() -> dict:
    datos = resumen_entrenamiento()
    return {
        "intenciones": IntencionAdminSerializer(
            datos["intenciones"], many=True
        ).data,
        "frases_total": datos["frases_total"],
        "conversaciones_total": datos["conversaciones_total"],
        "mensajes_total": datos["mensajes_total"],
        "modelo_activo": ModeloIASerializer(
            datos["modelo_activo"]
        ).data if datos["modelo_activo"] else None,
        "modelos": ModeloIASerializer(datos["modelos"], many=True).data,
    }


class PanelEntrenamientoView(APIView):
    """Resumen del catálogo y de la última versión entrenada."""

    permission_classes = [EsAdministrador]

    def get(self, request):
        return Response(_panel_serializado())


class ReentrenarView(APIView):
    """Reentrena el clasificador con las frases vigentes de la BD."""

    permission_classes = [EsAdministrador]

    def post(self, request):
        reentrenar_clasificador()
        return Response(_panel_serializado())
