"""Controlador de itinerarios (CU8)."""
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reservas.models import Itinerario
from apps.reservas.serializers.itinerario import (
    ItinerarioDetailSerializer,
    ItinerarioUpdateSerializer,
)
from apps.reservas.services.itinerarios import (
    actualizar_items_itinerario,
    obtener_itinerario_por_reserva,
)
from apps.usuarios.constants import ROL_ADMINISTRADOR

ROL_AGENTE_ID = 2


class ItinerarioViewSet(viewsets.ReadOnlyModelViewSet):
    """Consulta y edición de itinerarios día por día."""

    queryset = Itinerario.objects.select_related("reserva").prefetch_related("items").all()
    serializer_class = ItinerarioDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.rol_id in (ROL_ADMINISTRADOR, ROL_AGENTE_ID):
            return qs

        cliente = getattr(user, "cliente", None)
        if not cliente:
            return Itinerario.objects.none()
        return qs.filter(reserva__cliente=cliente)

    @action(detail=False, methods=["get"], url_path="por_reserva/(?P<reserva_id>[^/.]+)")
    def por_reserva(self, request, reserva_id=None):
        itinerario = obtener_itinerario_por_reserva(int(reserva_id))
        serializer = ItinerarioDetailSerializer(itinerario)
        return Response(serializer.data)

    @action(detail=True, methods=["put", "patch"])
    def editar_actividades(self, request, pk=None):
        user = request.user
        if user.rol_id not in (ROL_ADMINISTRADOR, ROL_AGENTE_ID):
            return Response(
                {"detail": "Solo el personal de la agencia puede personalizar itinerarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        itinerario = self.get_object()
        serializer = ItinerarioUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        itinerario_actualizado = serializer.update(itinerario, serializer.validated_data)
        return Response(ItinerarioDetailSerializer(itinerario_actualizado).data)

