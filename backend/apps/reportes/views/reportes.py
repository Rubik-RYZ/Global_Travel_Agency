"""Endpoints de reportes gerenciales (CU12)."""
from datetime import timedelta

from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reportes.permissions import EsAdministradorReportes
from apps.reportes.services.reportes import (
    csv_ventas,
    reporte_ocupacion,
    reporte_ventas,
)
from apps.reservas.models import Reserva

AGRUPACIONES = {"dia", "semana", "mes"}
CANALES = {Reserva.CANAL_WEB, Reserva.CANAL_AGENTE, Reserva.CANAL_PERSONAL}


def _fecha(valor, campo: str):
    if not valor:
        return None
    fecha = parse_date(valor)
    if not fecha:
        raise ValidationError({campo: "Use el formato YYYY-MM-DD."})
    return fecha


class ReporteVentasView(APIView):
    """Ventas, ingresos y desgloses por periodo, canal, paquete y empleado."""

    permission_classes = [EsAdministradorReportes]

    def get(self, request):
        hoy = timezone.localdate()
        desde = _fecha(request.query_params.get("desde"), "desde") or (
            hoy - timedelta(days=29)
        )
        hasta = _fecha(request.query_params.get("hasta"), "hasta") or hoy
        if desde > hasta:
            raise ValidationError(
                {"desde": "La fecha inicial no puede ser posterior a la final."}
            )

        agrupacion = request.query_params.get("agrupacion") or "dia"
        if agrupacion not in AGRUPACIONES:
            raise ValidationError({"agrupacion": "Use dia, semana o mes."})

        canal = request.query_params.get("canal") or None
        if canal and canal not in CANALES:
            raise ValidationError({"canal": "Canal no reconocido."})

        if request.query_params.get("formato") == "csv":
            contenido = csv_ventas(
                desde=desde, hasta=hasta, agrupacion=agrupacion, canal=canal
            )
            respuesta = HttpResponse(
                contenido, content_type="text/csv; charset=utf-8"
            )
            respuesta["Content-Disposition"] = (
                f'attachment; filename="reporte-ventas-{desde}-{hasta}.csv"'
            )
            return respuesta

        return Response(
            reporte_ventas(
                desde=desde, hasta=hasta, agrupacion=agrupacion, canal=canal
            )
        )


class ReporteOcupacionView(APIView):
    """Ocupacion de las salidas programadas dentro del rango solicitado."""

    permission_classes = [EsAdministradorReportes]

    def get(self, request):
        hoy = timezone.localdate()
        desde = _fecha(request.query_params.get("desde"), "desde") or hoy
        hasta = _fecha(request.query_params.get("hasta"), "hasta") or (
            hoy + timedelta(days=90)
        )
        if desde > hasta:
            raise ValidationError(
                {"desde": "La fecha inicial no puede ser posterior a la final."}
            )

        paquete_id = request.query_params.get("paquete_id")
        if paquete_id:
            try:
                paquete_id = int(paquete_id)
            except (TypeError, ValueError):
                raise ValidationError({"paquete_id": "Use un identificador numerico."})
        else:
            paquete_id = None

        return Response(
            reporte_ocupacion(desde=desde, hasta=hasta, paquete_id=paquete_id)
        )
