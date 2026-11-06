"""Controlador de vuelos (CU4)."""
from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.catalogo.permissions import EsAdminOAgente
from apps.catalogo.serializers.vuelo import (
    VueloDetailSerializer,
    VueloListSerializer,
    VueloWriteSerializer,
)
from apps.catalogo.services.vuelos import eliminar_vuelo, listar_vuelos, obtener_vuelo


class VueloViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD para la gestión de vuelos e inventario de asientos."""

    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        return listar_vuelos(
            origen=params.get("origen"),
            destino=params.get("destino"),
            fecha_salida=params.get("fecha_salida"),
            proveedor_id=int(params["proveedor_id"]) if params.get("proveedor_id") else None,
            solo_disponibles=params.get("solo_disponibles") in ("true", "1"),
            q=params.get("q"),
        )

    def get_serializer_class(self):
        if self.action == "list":
            return VueloListSerializer
        if self.action == "retrieve":
            return VueloDetailSerializer
        return VueloWriteSerializer

    def destroy(self, request, *args, **kwargs):
        vuelo_id = int(kwargs["pk"])
        eliminar_vuelo(vuelo_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

