"""Capa de presentación del catálogo — aeropuertos (CU3)."""
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.catalogo.models import Aeropuerto
from apps.catalogo.serializers import AeropuertoSerializer


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
