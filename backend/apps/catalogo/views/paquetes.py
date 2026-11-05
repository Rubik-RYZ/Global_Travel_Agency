"""Controladores de paquetes turísticos y salidas programadas (CU6)."""
from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.catalogo.permissions import EsAdminOAgente
from apps.catalogo.serializers.paquete import (
    PaqueteDetailSerializer,
    PaqueteListSerializer,
    PaqueteSalidaSerializer,
    PaqueteSalidaWriteSerializer,
    PaqueteWriteSerializer,
)
from apps.catalogo.services.paquetes import (
    eliminar_paquete,
    eliminar_salida,
    listar_paquetes,
    listar_salidas,
    obtener_paquete,
    obtener_salida,
)


class PaqueteViewSet(viewsets.ModelViewSet):
    """ViewSet para explorar y administrar paquetes turísticos."""

    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        return listar_paquetes(
            destino_id=int(params["destino_id"]) if params.get("destino_id") else None,
            solo_activos=params.get("solo_activos") in ("true", "1"),
            q=params.get("q"),
        )

    def get_serializer_class(self):
        if self.action == "list":
            return PaqueteListSerializer
        if self.action == "retrieve":
            return PaqueteDetailSerializer
        return PaqueteWriteSerializer

    def destroy(self, request, *args, **kwargs):
        paquete_id = int(kwargs["pk"])
        eliminar_paquete(paquete_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PaqueteSalidaViewSet(viewsets.ModelViewSet):
    """ViewSet para el calendario de salidas programadas y disponibilidad de cupos."""

    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        return listar_salidas(
            paquete_id=int(params["paquete_id"]) if params.get("paquete_id") else None,
            desde=params.get("desde"),
            solo_con_cupo=params.get("solo_con_cupo") in ("true", "1"),
        )

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return PaqueteSalidaSerializer
        return PaqueteSalidaWriteSerializer

    def destroy(self, request, *args, **kwargs):
        salida_id = int(kwargs["pk"])
        eliminar_salida(salida_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

