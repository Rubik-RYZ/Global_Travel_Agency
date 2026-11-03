"""Capa de presentación del catálogo — paquetes y salidas (CU6)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

from apps.catalogo import services
from apps.catalogo.permissions import EsAdminOAgente
from apps.catalogo.serializers import PaqueteSerializer, PaqueteSalidaSerializer


class PaqueteViewSet(viewsets.ModelViewSet):
    """
    CRUD de paquetes.

    Público (GET): listar y ver detalle, solo activos por defecto.
    Autenticado Admin/Agente: crear, editar, activar/desactivar.
    """

    serializer_class = PaqueteSerializer
    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        es_staff = (
            self.request.user
            and self.request.user.is_authenticated
            and self.request.user.rol_id in (1, 2)  # administrador, agente
        )
        params = self.request.query_params
        return services.listar_paquetes(
            solo_activos=False if es_staff else True,
            destino_id=params.get("destino"),
            hotel_id=params.get("hotel"),
            etiqueta=params.get("etiqueta"),
            q=params.get("q"),
        )

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            paquete = services.crear_paquete(**ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(
            PaqueteSerializer(paquete).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            paquete = services.actualizar_paquete(instance.pk, **ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(PaqueteSerializer(paquete).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            raise DRFValidationError(
                {"paquete": "El paquete está en uso y no puede eliminarse."}
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="toggle_activo")
    def toggle_activo(self, request, pk=None):
        paquete = services.toggle_activo_paquete(int(pk))
        return Response(PaqueteSerializer(paquete).data)


class PaqueteSalidaViewSet(viewsets.ModelViewSet):
    """
    CRUD de salidas de paquete.

    Público (GET): calendario de fechas y cupos.
    Autenticado Admin/Agente: crear, editar y eliminar salidas.
    """

    serializer_class = PaqueteSalidaSerializer
    permission_classes = [EsAdminOAgente]

    def get_queryset(self):
        params = self.request.query_params
        return services.listar_salidas(
            paquete_id=params.get("paquete"),
            desde=params.get("desde"),
            hasta=params.get("hasta"),
            solo_disponibles=params.get("disponibles") in ("1", "true", "True"),
        )

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            salida = services.crear_salida(**ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(
            PaqueteSalidaSerializer(salida).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            salida = services.actualizar_salida(instance.pk, **ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(PaqueteSalidaSerializer(salida).data)