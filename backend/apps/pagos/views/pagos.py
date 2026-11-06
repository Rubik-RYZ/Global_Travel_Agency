"""Controladores de pagos (CU9): ventanilla, compra del cliente y boleta PDF."""
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.pagos.models import Pago
from apps.pagos.serializers.pagos import (
    PagoClienteSerializer,
    PagoSerializer,
    VentaVentanillaSerializer,
)
from apps.pagos.services.boleta import generar_boleta_pdf
from apps.reservas.models import Reserva
from apps.reservas.serializers.reserva import ReservaDetailSerializer
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_AGENTE

ROLES_VENTANILLA = (ROL_ADMINISTRADOR, ROL_AGENTE)


def _es_personal(usuario) -> bool:
    return getattr(usuario, "rol_id", None) in ROLES_VENTANILLA


def _respuesta_venta(reserva, pago) -> dict:
    return {
        "reserva": ReservaDetailSerializer(reserva).data,
        "pago": PagoSerializer(pago).data,
        "boleta_url": f"/api/v1/pagos/boleta/{reserva.id}/",
    }


class VentaVentanillaView(APIView):
    """Venta presencial: solo administradores o agentes (empleados de ventanilla)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _es_personal(request.user):
            return Response(
                {
                    "error": "Solo administradores o agentes pueden vender en ventanilla.",
                    "code": "sin_permiso",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = VentaVentanillaSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        reserva, pago = serializer.save()
        return Response(_respuesta_venta(reserva, pago), status=status.HTTP_201_CREATED)


class PagoClienteView(APIView):
    """Pago en linea del viajero autenticado (solo tarjeta o QR, simulacion)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PagoClienteSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        pago = serializer.save()
        return Response(
            _respuesta_venta(pago.reserva, pago), status=status.HTTP_201_CREATED
        )


class BoletaPDFView(APIView):
    """Descarga la boleta PDF de una reserva pagada (personal o su titular)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, reserva_id):
        try:
            reserva = (
                Reserva.objects.select_related("cliente", "salida__paquete__destino")
                .prefetch_related("pasajeros")
                .get(pk=reserva_id)
            )
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada.", "code": "no_encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not _es_personal(request.user):
            cliente = getattr(request.user, "cliente", None)
            if not cliente or reserva.cliente_id != cliente.id:
                return Response(
                    {"error": "No autorizado.", "code": "sin_permiso"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        pago = (
            reserva.pagos.filter(estado=Pago.Estado.APROBADO)
            .order_by("-creado_en")
            .first()
        )
        if not pago:
            return Response(
                {
                    "error": "La reserva aun no tiene un pago aprobado.",
                    "code": "sin_pago",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pdf = generar_boleta_pdf(reserva=reserva, pago=pago)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="boleta-{reserva.codigo}.pdf"'
        )
        return response
