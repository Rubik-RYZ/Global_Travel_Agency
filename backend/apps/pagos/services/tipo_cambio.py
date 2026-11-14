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
    plantilla = getattr(settings, "EXCHANGE_RATE_API_URL", API_URL_DEFECTO)
    with urlopen(plantilla.format(origen=origen), timeout=API_TIMEOUT_SEGUNDOS) as resp:
        datos = json.load(resp)
    tasa = Decimal(str(datos["rates"][destino]))
    if tasa <= 0:
        raise ValueError("La API devolvió una tasa no válida.")
    return tasa

def guardar_tasa(*, fecha: date, origen: str, destino: str, tasa: Decimal) -> TipoCambio:
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

    if origen == destino:
        return Decimal("1"), "misma_moneda"

    hoy = fecha or timezone.localdate()

    t = TipoCambio.objects.filter(
        fecha=hoy, moneda_origen=origen, moneda_destino=destino
    ).first()
    if t:
        return t.tasa, "cache"

    try:
        tasa = _consultar_api(origen, destino)
        guardar_tasa(fecha=hoy, origen=origen, destino=destino, tasa=tasa)
        return tasa.quantize(SEIS_DECIMALES), "api"
    except Exception as exc:
        logger.warning("No se pudo consultar el tipo de cambio %s->%s: %s", origen, destino, exc)

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

    raise ValidationError(
        {"tipo_cambio": f"No hay un tipo de cambio reciente para {origen}->{destino}. Cárgalo manualmente."}
    )

def convertir_a_bob(monto: Decimal, moneda: str) -> tuple[Decimal, Decimal, str]:
    tasa, fuente = obtener_tasa(moneda, MONEDA_BASE)
    monto_bob = (Decimal(monto) * tasa).quantize(DOS_DECIMALES)
    return monto_bob, tasa, fuente
