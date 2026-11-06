"""Controlador de reservas (CU7)."""
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reservas.models import Reserva
from apps.reservas.serializers.reserva import (
    ReservaCreateSerializer,
    ReservaDetailSerializer,
    ReservaListSerializer,
)
from apps.reservas.services.reservas import cancelar_reserva, listar_reservas, obtener_reserva
from apps.usuarios.constants import ROL_ADMINISTRADOR

ROL_AGENTE_ID = 2


class ReservaViewSet(viewsets.ModelViewSet):
    """ViewSet para la gestión de reservas de clientes y ventas de la agencia."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        # Administrador y agentes ven todas las reservas
        if user.rol_id in (ROL_ADMINISTRADOR, ROL_AGENTE_ID):
            return listar_reservas(
                cliente_id=int(params["cliente_id"]) if params.get("cliente_id") else None,
                estado=params.get("estado"),
                canal=params.get("canal"),
                q=params.get("q"),
            )

        # Clientes ven únicamente sus propias reservas
        cliente = getattr(user, "cliente", None)
        if not cliente:
            return Reserva.objects.none()

        return listar_reservas(
            cliente_id=cliente.id,
            estado=params.get("estado"),
            q=params.get("q"),
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ReservaCreateSerializer
        if self.action == "retrieve":
            return ReservaDetailSerializer
        return ReservaListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reserva = serializer.save()
        out_serializer = ReservaDetailSerializer(reserva)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        """Cancela la reserva y revierte los cupos con concurrencia controlada."""
        reserva = self.get_object()
        reserva_cancelada = cancelar_reserva(reserva.id)
        return Response(ReservaDetailSerializer(reserva_cancelada).data)

