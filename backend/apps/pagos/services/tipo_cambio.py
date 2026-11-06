"""Capa de negocio del tipo de cambio (dominio de pagos)."""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from decimal import Decimal
from urllib.request import urlopen

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.pagos.models import TipoCambio

logger = logging.getLogger(__name__)

MONEDA_BASE = "BOB"
MAX_ANTIGUEDAD_DIAS = 3
API_TIMEOUT_SEGUNDOS = 4
API_URL_DEFECTO = "https://open.er-api.com/v6/latest/{origen}"
SEIS_DECIMALES = Decimal("0.000001")
DOS_DECIMALES = Decimal("0.01")


def _consultar_api(origen: str, destino: str) -> Decimal:
    """Consulta la tasa a la API externa. Lanza excepción si algo falla."""
    plantilla = getattr(settings, "EXCHANGE_RATE_API_URL", API_URL_DEFECTO)
    with urlopen(plantilla.format(origen=origen), timeout=API_TIMEOUT_SEGUNDOS) as resp:
        datos = json.load(resp)
    tasa = Decimal(str(datos["rates"][destino]))
    if tasa <= 0:
        raise ValueError("La API devolvió una tasa no válida.")
    return tasa


def guardar_tasa(*, fecha: date, origen: str, destino: str, tasa: Decimal) -> TipoCambio:
    """Crea o actualiza la tasa de un día y un par de monedas."""
    registro, _ = TipoCambio.objects.update_or_create(
        fecha=fecha,
        moneda_origen=origen,
        moneda_destino=destino,
        defaults={"tasa": Decimal(tasa).quantize(SEIS_DECIMALES)},
    )
    return registro


def obtener_tasa(
    origen: str, destino: str = MONEDA_BASE, *, fecha: date | None = None
) -> tuple[Decimal, str]:
    """Devuelve (tasa, fuente). La fuente es: misma_moneda, cache, api o ultima_guardada."""
    if origen == destino:
        return Decimal("1"), "misma_moneda"

    hoy = fecha or timezone.localdate()

    # 1) Tasa del día ya guardada
    t = TipoCambio.objects.filter(
        fecha=hoy, moneda_origen=origen, moneda_destino=destino
    ).first()
    if t:
        return t.tasa, "cache"

    # 2) API externa (con timeout); si falla, se sigue con el respaldo
    try:
        tasa = _consultar_api(origen, destino)
        guardar_tasa(fecha=hoy, origen=origen, destino=destino, tasa=tasa)
        return tasa.quantize(SEIS_DECIMALES), "api"
    except Exception as exc:  # sin internet, timeout, límite de la API, etc.
        logger.warning("No se pudo consultar el tipo de cambio %s->%s: %s", origen, destino, exc)

    # 3) Última tasa guardada, si no es demasiado vieja
    t = (
        TipoCambio.objects.filter(
            moneda_origen=origen,
            moneda_destino=destino,
            fecha__gte=hoy - timedelta(days=MAX_ANTIGUEDAD_DIAS),
        )
        .order_by("-fecha")
        .first()
    )
    if t:
        logger.warning("Usando la tasa %s->%s del %s como respaldo.", origen, destino, t.fecha)
        return t.tasa, "ultima_guardada"

    # 4) Sin tasa válida: no se inventa un valor
    raise ValidationError(
        {"tipo_cambio": f"No hay un tipo de cambio reciente para {origen}->{destino}. Cárgalo manualmente."}
    )


def convertir_a_bob(monto: Decimal, moneda: str) -> tuple[Decimal, Decimal, str]:
    """Devuelve (monto_bob, tasa_usada, fuente) para guardar en el pago."""
    tasa, fuente = obtener_tasa(moneda, MONEDA_BASE)
    monto_bob = (Decimal(monto) * tasa).quantize(DOS_DECIMALES)
    return monto_bob, tasa, fuente