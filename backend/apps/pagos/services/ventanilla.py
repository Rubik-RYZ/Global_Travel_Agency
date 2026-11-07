"""Venta presencial en ventanilla (CU9).

Resuelve (o registra) al cliente walk-in y emite la reserva + el pago total en
una sola transaccion, reutilizando `crear_reserva_pagada`.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.pagos.services.pagos import crear_reserva_pagada
from apps.usuarios.models import Cliente


def _resolver_cliente(*, cliente_id=None, cliente_nuevo=None) -> Cliente:
    if cliente_id:
        try:
            return Cliente.objects.get(pk=cliente_id)
        except Cliente.DoesNotExist:
            raise ValidationError({"cliente_id": "El cliente indicado no existe."})

    if not cliente_nuevo:
        raise ValidationError({"cliente": "Debes indicar un cliente existente o registrar uno nuevo."})

    return Cliente.objects.create(
        nombres=(cliente_nuevo.get("nombres") or "").strip(),
        apellidos=(cliente_nuevo.get("apellidos") or "").strip(),
        documento_tipo=cliente_nuevo.get("documento_tipo"),
        documento_numero=(cliente_nuevo.get("documento_numero") or "").strip() or None,
        telefono=(cliente_nuevo.get("telefono") or "").strip() or None,
        fecha_nacimiento=cliente_nuevo.get("fecha_nacimiento"),
    )


@transaction.atomic
def registrar_venta_ventanilla(
    *,
    cliente_id=None,
    cliente_nuevo=None,
    salida_id: int,
    num_personas: int,
    pasajeros_datos: list[dict],
    metodo: str = "efectivo",
    registrado_por=None,
):
    """Registra la venta completa de mostrador (cliente + reserva + pago)."""
    cliente = _resolver_cliente(cliente_id=cliente_id, cliente_nuevo=cliente_nuevo)
    return crear_reserva_pagada(
        cliente_id=cliente.id,
        salida_id=salida_id,
        num_personas=num_personas,
        pasajeros_datos=pasajeros_datos,
        metodo=metodo,
        registrado_por=registrado_por,
    )
