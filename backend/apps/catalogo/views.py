"""Capa de presentación del catálogo turístico (CU3)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.catalogo import services
from apps.catalogo.models import Aeropuerto, Destino, Proveedor
from apps.catalogo.permissions import EsAdmin, EsAdminOAgente
from apps.catalogo.serializers import (
    AeropuertoSerializer,
    DestinoResumenSerializer,
    DestinoSerializer,
    ProveedorSerializer,
)


class DestinoViewSet(viewsets.ModelViewSet):
    """
    CRUD de destinos.

    Público (GET): listar y ver detalle, solo activos por defecto.
    Autenticado Admin/Agente: crear, editar, activar/desactivar.
    """

    serializer_class = DestinoSerializer
    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        es_staff = (
            self.request.user
            and self.request.user.is_authenticated
            and self.request.user.rol_id in (1, 2)  # administrador, agente
        )
        params = self.request.query_params
        return services.listar_destinos(
            solo_activos=not es_staff,
            pais=params.get("pais"),
            etiqueta=params.get("etiqueta"),
            q=params.get("q"),
        )

    def get_serializer_class(self):
        if self.action == "list" and not (
            self.request.user
            and self.request.user.is_authenticated
            and self.request.user.rol_id in (1, 2)  # administrador, agente
        ):
            return DestinoResumenSerializer
        return DestinoSerializer

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            destino = services.crear_destino(**ser.validated_data)
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(DestinoSerializer(destino).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            destino = services.actualizar_destino(instance.pk, **ser.validated_data)
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(DestinoSerializer(destino).data)

    @action(detail=True, methods=["post"], permission_classes=[EsAdmin])
    def toggle_activo(self, request, pk=None):
        try:
            destino = services.toggle_activo_destino(int(pk))
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_404_NOT_FOUND)
        return Response(DestinoSerializer(destino).data)


class AeropuertoViewSet(viewsets.ReadOnlyModelViewSet):
    """Listado de aeropuertos (solo lectura, público)."""

    serializer_class = AeropuertoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Aeropuerto.objects.select_related("destino")
        destino_id = self.request.query_params.get("destino")
        if destino_id:
            qs = qs.filter(destino_id=destino_id)
        return qs.order_by("codigo_iata")


class ProveedorViewSet(viewsets.ModelViewSet):
    """
    CRUD de proveedores.

    Solo Admin/Agente pueden leer; solo Admin puede crear/editar.
    """

    serializer_class = ProveedorSerializer
    permission_classes = [EsAdmin]

    def get_queryset(self):
        params = self.request.query_params
        return services.listar_proveedores(
            tipo=params.get("tipo"),
            q=params.get("q"),
        )

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            proveedor = services.crear_proveedor(**{
                k: v for k, v in ser.validated_data.items()
                if k not in ("tipo_display",)
            })
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProveedorSerializer(proveedor).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            proveedor = services.actualizar_proveedor(instance.pk, **{
                k: v for k, v in ser.validated_data.items()
                if k not in ("tipo_display",)
            })
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProveedorSerializer(proveedor).data)

    @action(detail=True, methods=["post"], permission_classes=[EsAdmin])
    def toggle_activo(self, request, pk=None):
        try:
            proveedor = services.toggle_activo_proveedor(int(pk))
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_404_NOT_FOUND)
        return Response(ProveedorSerializer(proveedor).data)
