from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.pagos.models import Pago
from apps.pagos.serializers.pagos import (
    PagoAdminSerializer,
    PagoClienteSerializer,
    PagoSerializer,
    VentaVentanillaSerializer,
)
from apps.pagos.services.boleta import generar_boleta_pdf
from apps.pagos.services.pagos import listar_pagos
from apps.reservas.models import Reserva
from apps.reservas.serializers.reserva import ReservaDetailSerializer
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_AGENTE
from apps.usuarios.permissions import EsPanel

ROLES_VENTANILLA = (ROL_ADMINISTRADOR, ROL_AGENTE)

ESTADOS_PAGO = set(Pago.Estado.values)
MONEDAS_PAGO = set(Pago.Moneda.values)
METODOS_PAGO = {"efectivo", "tarjeta", "qr", "transferencia"}

def _fecha(valor, campo: str):
    if not valor:
        return None
    fecha = parse_date(valor)
    if not fecha:
        raise ValidationError({campo: "Use el formato YYYY-MM-DD."})
    return fecha

def _entero(valor, campo: str):
    if valor in (None, ""):
        return None
    try:
        return int(valor)
    except (TypeError, ValueError):
        raise ValidationError({campo: "Use un identificador numerico."})

def _monto(valor):
    return str((valor or Decimal("0.00")).quantize(Decimal("0.01")))

def _es_personal(usuario) -> bool:
    return getattr(usuario, "rol_id", None) in ROLES_VENTANILLA

def _respuesta_venta(reserva, pago) -> dict:
    return {
        "reserva": ReservaDetailSerializer(reserva).data,
        "pago": PagoSerializer(pago).data,
        "boleta_url": f"/api/v1/pagos/boleta/{reserva.id}/",
    }

class PagoListView(generics.ListAPIView):
    serializer_class = PagoAdminSerializer
    permission_classes = [EsPanel]

    def get_queryset(self):
        params = self.request.query_params
        estado = params.get("estado") or None
        if estado and estado not in ESTADOS_PAGO:
            raise ValidationError({"estado": "Estado de pago no reconocido."})

        metodo = params.get("metodo") or None
        if metodo and metodo not in METODOS_PAGO:
            raise ValidationError({"metodo": "Metodo de pago no reconocido."})

        moneda = params.get("moneda") or None
        if moneda and moneda not in MONEDAS_PAGO:
            raise ValidationError({"moneda": "Moneda no reconocida."})

        desde = _fecha(params.get("desde"), "desde")
        hasta = _fecha(params.get("hasta"), "hasta")
        if desde and hasta and desde > hasta:
            raise ValidationError(
                {"desde": "La fecha inicial no puede ser posterior a la final."}
            )

        return listar_pagos(
            reserva_id=_entero(params.get("reserva_id"), "reserva_id"),
            estado=estado,
            metodo=metodo,
            moneda=moneda,
            q=(params.get("q") or "").strip() or None,
            desde=desde,
            hasta=hasta,
        )

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        pagina = self.paginate_queryset(queryset)
        pagos = pagina if pagina is not None else queryset
        serializer = self.get_serializer(pagos, many=True)
        respuesta = self.get_paginated_response(serializer.data)

        totales = queryset.aggregate(
            total_bob=Coalesce(Sum("monto_bob"), Decimal("0.00")),
            aprobado_bob=Coalesce(
                Sum("monto_bob", filter=Q(estado=Pago.Estado.APROBADO)),
                Decimal("0.00"),
            ),
            pendiente_bob=Coalesce(
                Sum("monto_bob", filter=Q(estado=Pago.Estado.PENDIENTE)),
                Decimal("0.00"),
            ),
            reembolsado_bob=Coalesce(
                Sum("monto_bob", filter=Q(estado=Pago.Estado.REEMBOLSADO)),
                Decimal("0.00"),
            ),
        )
        respuesta.data["totales"] = {
            "total_registros": queryset.count(),
            "total_bob": _monto(totales["total_bob"]),
            "aprobado_bob": _monto(totales["aprobado_bob"]),
            "pendiente_bob": _monto(totales["pendiente_bob"]),
            "reembolsado_bob": _monto(totales["reembolsado_bob"]),
        }
        return respuesta

class VentaVentanillaView(APIView):
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
