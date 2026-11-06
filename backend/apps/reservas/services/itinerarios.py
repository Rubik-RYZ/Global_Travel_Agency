"""Capa de negocio para itinerarios automáticos y personalizados (CU8)."""
from __future__ import annotations

from datetime import time
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.reservas.models import Itinerario, ItinerarioItem, Reserva


@transaction.atomic
def generar_itinerario_automatico(reserva: Reserva) -> Itinerario:
    """Genera automáticamente el itinerario a partir del destino y vuelos de la salida."""
    itinerario, _ = Itinerario.objects.get_or_create(
        reserva=reserva,
        defaults={"generado_por": Itinerario.GENERADO_SISTEMA},
    )

    # Si ya tenía items, los conservamos o limpiamos para regenerar
    if itinerario.items.exists():
        return itinerario

    salida = reserva.salida
    paquete = salida.paquete
    destino = paquete.destino
    duracion = paquete.duracion_dias

    # 1. Vuelo de ida (Día 1)
    orden_dia_1 = 1
    if salida.vuelo_ida:
        vuelo = salida.vuelo_ida
        hora_vuelo = vuelo.salida.time() if vuelo.salida else time(8, 0)
        ItinerarioItem.objects.create(
            itinerario=itinerario,
            dia=1,
            orden=orden_dia_1,
            hora=hora_vuelo,
            titulo=f"Vuelo de partida: {vuelo.numero_vuelo}",
            descripcion=f"Embarque en {vuelo.origen.nombre} ({vuelo.origen_id}) con destino a {vuelo.destino.nombre} ({vuelo.destino_id}). Operado por {vuelo.proveedor.nombre}.",
        )
        orden_dia_1 += 1

    # 2. Días de ruta desde el diario de viaje del destino (ItinerarioDia)
    dias_destino = list(destino.itinerario.all().order_by("numero_dia"))
    for d in dias_destino:
        dia_num = d.numero_dia
        if dia_num > duracion:
            continue
        orden = 2 if dia_num == 1 and salida.vuelo_ida else 1
        ItinerarioItem.objects.create(
            itinerario=itinerario,
            dia=dia_num,
            orden=orden,
            hora=time(9, 30),
            titulo=d.titulo,
            descripcion=d.descripcion or f"Jornada en {d.ubicacion or destino.nombre}.",
        )

    # Si no había días en el destino, crear al menos la estructura básica
    if not dias_destino:
        for num in range(1, duracion + 1):
            if num == 1 and salida.vuelo_ida:
                continue
            ItinerarioItem.objects.create(
                itinerario=itinerario,
                dia=num,
                orden=1,
                hora=time(9, 0),
                titulo=f"Día {num}: Exploración en {destino.nombre}",
                descripcion=f"Recorrido y actividades en {destino.nombre}.",
            )

    # 3. Vuelo de vuelta (Último día)
    if salida.vuelo_vuelta:
        vuelo_v = salida.vuelo_vuelta
        hora_retorno = vuelo_v.salida.time() if vuelo_v.salida else time(17, 0)
        max_orden = (
            ItinerarioItem.objects.filter(itinerario=itinerario, dia=duracion).count() + 1
        )
        ItinerarioItem.objects.create(
            itinerario=itinerario,
            dia=duracion,
            orden=max_orden,
            hora=hora_retorno,
            titulo=f"Vuelo de regreso: {vuelo_v.numero_vuelo}",
            descripcion=f"Vuelo de vuelta desde {vuelo_v.origen.nombre} hacia {vuelo_v.destino.nombre}.",
        )

    return itinerario


def obtener_itinerario_por_reserva(reserva_id: int) -> Itinerario:
    try:
        return Itinerario.objects.prefetch_related("items").get(reserva_id=reserva_id)
    except Itinerario.DoesNotExist:
        reserva = Reserva.objects.get(pk=reserva_id)
        return generar_itinerario_automatico(reserva)


@transaction.atomic
def actualizar_items_itinerario(itinerario_id: int, items_data: list[dict]) -> Itinerario:
    """Permite al personal de la agencia personalizar las actividades de una reserva."""
    try:
        itinerario = Itinerario.objects.get(pk=itinerario_id)
    except Itinerario.DoesNotExist:
        raise ValidationError({"itinerario_id": "Itinerario no encontrado."})

    # Reemplazar actividades
    itinerario.items.all().delete()
    for it in items_data:
        ItinerarioItem.objects.create(
            itinerario=itinerario,
            dia=it["dia"],
            orden=it.get("orden", 1),
            hora=it.get("hora"),
            titulo=it["titulo"].strip(),
            descripcion=it.get("descripcion", "").strip() or None,
            latitud=it.get("latitud"),
            longitud=it.get("longitud"),
        )

    itinerario.generado_por = Itinerario.GENERADO_PERSONAL
    itinerario.save(update_fields=["generado_por"])
    return itinerario
