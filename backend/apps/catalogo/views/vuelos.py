"""Capa de presentación del catálogo — vuelos (CU4)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

from apps.catalogo import services
from apps.catalogo.permissions import EsPersonal
from apps.catalogo.serializers import VueloSerializer


class VueloViewSet(viewsets.ModelViewSet):
    """
    CRUD de vuelos del panel.

    Solo personal autenticado (administrador/agente) puede leer y escribir.
    """

    serializer_class = VueloSerializer
    permission_classes = [EsPersonal]

    def get_queryset(self):
        params = self.request.query_params
        return services.listar_vuelos(
            proveedor_id=params.get("proveedor"),
            origen=params.get("origen"),
            destino=params.get("destino"),
            desde=params.get("desde"),
            hasta=params.get("hasta"),
            solo_disponibles=params.get("disponibles") in ("1", "true", "True"),
            q=params.get("q"),
        )

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            vuelo = services.crear_vuelo(**ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(VueloSerializer(vuelo).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        parcial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=parcial)
        ser.is_valid(raise_exception=True)
        try:
            vuelo = services.actualizar_vuelo(instance.pk, **ser.validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
        return Response(VueloSerializer(vuelo).data)