"""Capa de presentación del catálogo — hoteles (CU5)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

from apps.catalogo import services
from apps.catalogo.permissions import EsAdminOAgente
from apps.catalogo.serializers import HotelSerializer


class HotelViewSet(viewsets.ModelViewSet):
    """
    CRUD de hoteles.

    Público (GET): listar y ver detalle, solo activos por defecto.
    Autenticado Admin/Agente: crear, editar, activar/desactivar.
    """

    serializer_class = HotelSerializer
    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        es_staff = (
            self.request.user
            and self.request.user.is_authenticated
            and self.request.user.rol_id in (1, 2)  # administrador, agente
        )
        params = self.request.query_params
        return services.listar_hoteles(
            solo_activos=False if es_staff else True,
            proveedor_id=params.get("proveedor"),
            destino_id=params.get("destino"),
            estrellas=int(params["estrellas"]) if params.get("estrellas") else None,
            q=params.get("q"),
        )

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            hotel = services.crear_hotel(**ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(HotelSerializer(hotel).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            hotel = services.actualizar_hotel(instance.pk, **ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(HotelSerializer(hotel).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            raise DRFValidationError(
                {"hotel": "El hotel está en uso por un paquete y no puede retirarse."}
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="toggle_activo")
    def toggle_activo(self, request, pk=None):
        hotel = services.toggle_activo_hotel(int(pk))
        return Response(HotelSerializer(hotel).data)