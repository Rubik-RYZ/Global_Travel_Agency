"""Capa de negocio de pagos (dominio de pagos)."""
from __future__ import annotations

import logging
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import QuerySet, Sum

from apps.notificaciones.services.envio import enviar
from apps.pagos.models import Pago
from apps.pagos.services.tipo_cambio import convertir_a_bob
from apps.reservas.models import Notificacion, Reserva

logger = logging.getLogger(__name__)

CERO = Decimal("0.00")
DOS_DECIMALES = Decimal("0.01")


def listar_pagos(*, reserva_id: int | None = None, estado: str | None = None) -> QuerySet[Pago]:
    qs = Pago.objects.select_related("reserva", "reserva__cliente")
    if reserva_id:
        qs = qs.filter(reserva_id=reserva_id)
    if estado:
        qs = qs.filter(estado=estado)
    return qs.order_by("-creado_en")


def obtener_pago(pago_id: int) -> Pago:
    try:
        return Pago.objects.select_related("reserva", "reserva__cliente").get(pk=pago_id)
    except Pago.DoesNotExist:
        raise ValidationError({"pago_id": "Pago no encontrado."})


def total_pagado(reserva: Reserva) -> Decimal:
    """Suma de los pagos aprobados de la reserva (en la moneda de la reserva)."""
    suma = reserva.pagos.filter(estado=Pago.Estado.APROBADO).aggregate(total=Sum("monto"))
    return suma["total"] or CERO


def saldo_pendiente(reserva: Reserva) -> Decimal:
    return max(reserva.total - total_pagado(reserva), CERO)


@transaction.atomic
def registrar_pago(
    *,
    reserva_id: int,
    monto: Decimal | str | float | None = None,
    moneda: str | None = None,
    metodo: str = "tarjeta",
    stripe_payment_id: str | None = None,
    estado: str = Pago.Estado.APROBADO,
) -> Pago:
    """Registra un pago de forma atómica y, si cubre el total, marca la reserva como pagada."""
    if estado not in Pago.Estado.values:
        raise ValidationError({"estado": f"Estado de pago inválido: {estado}."})

    try:
        # of=("self",) bloquea solo la reserva (evita error con joins opcionales)
        reserva = (
            Reserva.objects.select_for_update(of=("self",))
            .select_related("cliente", "cliente__usuario")
            .get(pk=reserva_id)
        )
    except Reserva.DoesNotExist:
        raise ValidationError({"reserva_id": "Reserva no encontrada."})

    if reserva.estado == Reserva.ESTADO_CANCELADA:
        raise ValidationError({"reserva": "No se puede pagar una reserva cancelada."})
    if reserva.estado == Reserva.ESTADO_PAGADA:
        raise ValidationError({"reserva": "La reserva ya está pagada."})

    # El pago se hace en la moneda de la reserva (mantiene simple el saldo)
    if moneda and moneda != reserva.moneda:
        raise ValidationError({"moneda": f"Esta reserva se paga en {reserva.moneda}."})
    moneda = reserva.moneda

    saldo = saldo_pendiente(reserva)
    try:
        monto_dec = saldo if monto is None else Decimal(str(monto)).quantize(DOS_DECIMALES)
    except InvalidOperation:
        raise ValidationError({"monto": "El monto no es un número válido."})

    if monto_dec <= 0:
        raise ValidationError({"monto": "El monto debe ser mayor a 0."})
    if monto_dec > saldo:
        raise ValidationError({"monto": f"El monto supera el saldo pendiente ({saldo} {moneda})."})

    # Evita registrar dos veces el mismo cobro de Stripe
    if stripe_payment_id and Pago.objects.filter(stripe_payment_id=stripe_payment_id).exists():
        raise ValidationError({"stripe_payment_id": "Este pago ya fue registrado."})

    # Convierte a bolivianos y congela la tasa usada en el propio pago
    monto_bob, tasa, fuente = convertir_a_bob(monto_dec, moneda)
    logger.info("Pago reserva %s: %s %s -> %s BOB (tasa %s, fuente %s)",
                reserva.codigo, monto_dec, moneda, monto_bob, tasa, fuente)

    pago = Pago.objects.create(
        reserva=reserva,
        monto=monto_dec,
        moneda=moneda,
        tipo_cambio_a_bob=tasa,
        monto_bob=monto_bob,
        metodo=metodo,
        estado=estado,
        stripe_payment_id=stripe_payment_id,
    )

    if estado == Pago.Estado.APROBADO and total_pagado(reserva) >= reserva.total:
        reserva.estado = Reserva.ESTADO_PAGADA
        reserva.save(update_fields=["estado", "actualizada_en"])

    # El correo sale solo si la transacción se confirmó
    transaction.on_commit(lambda: _notificar_comprobante(pago.pk))
    return pago


def _notificar_comprobante(pago_id: int) -> None:
    """Registra la notificación y envía el comprobante. Nunca rompe el flujo del pago."""
    try:
        pago = Pago.objects.select_related("reserva", "reserva__cliente", "reserva__cliente__usuario").get(pk=pago_id)
        if pago.estado != Pago.Estado.APROBADO:
            return
        reserva = pago.reserva
        usuario = getattr(reserva.cliente, "usuario", None)
        tipo = Notificacion.TIPO_PAGO

        notif = Notificacion.objects.create(
            usuario=usuario, reserva=reserva, tipo=tipo, estado=Notificacion.ESTADO_PENDIENTE
        )
        html = f"""
        <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>Illimani Global Travel</h2>
          <p>Estimado/a <strong>{reserva.cliente.nombre_completo}</strong>, recibimos su pago.</p>
          <p><strong>Reserva:</strong> {reserva.codigo}</p>
          <p><strong>Monto:</strong> {pago.moneda} {pago.monto:.2f} (equivale a Bs {pago.monto_bob:.2f})</p>
          <p><strong>Estado de la reserva:</strong> {reserva.get_estado_display()}</p>
        </div>
        """
        exito = enviar(
            para=usuario.email,
            asunto=f"Comprobante de pago {reserva.codigo} - Illimani Global Travel",
            html=html,
            usuario=usuario,
            evento="comprobante_pago",
        )
        notif.estado = Notificacion.ESTADO_ENVIADA if exito else Notificacion.ESTADO_PENDIENTE
        notif.save(update_fields=["estado"])
    except Exception:
        logger.exception("No se pudo enviar el comprobante del pago %s", pago_id)

@transaction.atomic
def crear_reserva_pagada(
    *,
    cliente_id: int,
    salida_id: int,
    num_personas: int,
    pasajeros_datos: list[dict],
    metodo: str = "efectivo",
):
    """Reserva de mostrador: crea la reserva y registra el pago total en una sola transaccion."""
    from apps.reservas.services.reservas import crear_reserva

    reserva = crear_reserva(
        cliente_id=cliente_id,
        salida_id=salida_id,
        num_personas=num_personas,
        pasajeros_datos=pasajeros_datos,
        canal=Reserva.CANAL_PERSONAL,
    )
    pago = registrar_pago(reserva_id=reserva.pk, monto=reserva.total, metodo=metodo)
    reserva.refresh_from_db()
    return reserva, pago


@transaction.atomic
def registrar_pago_cliente(*, usuario, reserva_id: int, metodo: str = "tarjeta") -> Pago:
    """Pago en linea del propio viajero: solo tarjeta o QR, siempre aprobado (simulado)."""
    if metodo not in ("tarjeta", "qr"):
        raise ValidationError({"metodo": "En linea solo se acepta tarjeta o QR."})

    cliente = getattr(usuario, "cliente", None)
    if not cliente:
        raise ValidationError({"reserva_id": "Tu usuario no tiene un perfil de viajero asociado."})

    try:
        reserva = Reserva.objects.get(pk=reserva_id)
    except Reserva.DoesNotExist:
        raise ValidationError({"reserva_id": "Reserva no encontrada."})

    if reserva.cliente_id != cliente.id:
        raise ValidationError({"reserva_id": "No puedes pagar una reserva de otro cliente."})

    # Sin pasarela real: la confirmacion se simula y siempre valida.
    return registrar_pago(
        reserva_id=reserva.pk,
        monto=None,
        metodo=metodo,
        estado=Pago.Estado.APROBADO,
    )