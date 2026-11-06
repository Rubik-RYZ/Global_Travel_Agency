"""Controladores de hoteles y habitaciones (CU5)."""
from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.catalogo.permissions import EsAdminOAgente
from apps.catalogo.serializers.hotel import (
    HabitacionSerializer,
    HabitacionWriteSerializer,
    HotelDetailSerializer,
    HotelListSerializer,
    HotelWriteSerializer,
)
from apps.catalogo.services.hoteles import (
    eliminar_habitacion,
    eliminar_hotel,
    listar_habitaciones,
    listar_hoteles,
    obtener_hotel,
)


class HotelViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD para la administración de hoteles asociados a destinos."""

    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        return listar_hoteles(
            destino_id=int(params["destino_id"]) if params.get("destino_id") else None,
            proveedor_id=int(params["proveedor_id"]) if params.get("proveedor_id") else None,
            solo_activos=params.get("solo_activos") in ("true", "1"),
            estrellas=int(params["estrellas"]) if params.get("estrellas") else None,
            q=params.get("q"),
        )

    def get_serializer_class(self):
        if self.action == "list":
            return HotelListSerializer
        if self.action == "retrieve":
            return HotelDetailSerializer
        return HotelWriteSerializer

    def destroy(self, request, *args, **kwargs):
        hotel_id = int(kwargs["pk"])
        eliminar_hotel(hotel_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class HabitacionViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD para las habitaciones de un hotel."""

    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        hotel_id = int(params["hotel_id"]) if params.get("hotel_id") else None
        return listar_habitaciones(hotel_id=hotel_id)

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return HabitacionSerializer
        return HabitacionWriteSerializer

    def destroy(self, request, *args, **kwargs):
        habitacion_id = int(kwargs["pk"])
        eliminar_habitacion(habitacion_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

