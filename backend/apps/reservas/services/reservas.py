from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import connection, transaction
from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.catalogo.models import PaqueteSalida
from apps.reservas.models import Reserva, ReservaPasajero
from apps.usuarios.models import Cliente

def generar_codigo_reserva() -> str:
    anio = datetime.now().year
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT nextval('seq_codigo_reserva')")
            num = cursor.fetchone()[0]
        return f"RES-{anio}-{int(num):06d}"
    except Exception:

        total = Reserva.objects.filter(codigo__startswith=f"RES-{anio}-").count() + 1
        return f"RES-{anio}-{total:06d}"

def listar_reservas(
    *,
    cliente_id: int | None = None,
    estado: str | None = None,
    canal: str | None = None,
    q: str | None = None,
) -> QuerySet[Reserva]:
    qs = (
        Reserva.objects.select_related("cliente", "cliente__usuario", "salida", "salida__paquete", "salida__paquete__destino")
        .prefetch_related("pasajeros", "itinerario__items")
        .all()
    )
    if cliente_id:
        qs = qs.filter(cliente_id=cliente_id)
    if estado:
        qs = qs.filter(estado=estado)
    if canal:
        qs = qs.filter(canal=canal)
    if q:
        qs = qs.filter(
            Q(codigo__icontains=q)
            | Q(cliente__nombres__icontains=q)
            | Q(cliente__apellidos__icontains=q)
            | Q(cliente__documento_numero__icontains=q)
            | Q(salida__paquete__nombre__icontains=q)
        )
    return qs.order_by("-creada_en")

def obtener_reserva(reserva_id: int) -> Reserva:
    try:
        return (
            Reserva.objects.select_related("cliente", "cliente__usuario", "salida", "salida__paquete", "salida__paquete__destino")
            .prefetch_related("pasajeros", "itinerario__items")
            .get(pk=reserva_id)
        )
    except Reserva.DoesNotExist:
        raise ValidationError({"reserva_id": "Reserva no encontrada."})

@transaction.atomic
def crear_reserva(
    *,
    cliente_id: int,
    salida_id: int,
    num_personas: int,
    pasajeros_datos: list[dict],
    canal: str = "web",
    conversacion_id=None,
    registrado_por=None,
) -> Reserva:

    if num_personas <= 0:
        raise ValidationError({"num_personas": "El número de personas debe ser mayor a 0."})

    if len(pasajeros_datos) != num_personas:
        raise ValidationError({
            "pasajeros": f"Se especificaron {num_personas} personas pero se proporcionaron datos de {len(pasajeros_datos)} pasajeros."
        })

    try:
        cliente = Cliente.objects.select_related("usuario").get(pk=cliente_id)
    except Cliente.DoesNotExist:
        raise ValidationError({"cliente_id": "El cliente indicado no existe."})

    try:
        salida = PaqueteSalida.objects.select_for_update().select_related("paquete", "paquete__destino").get(pk=salida_id)
    except PaqueteSalida.DoesNotExist:
        raise ValidationError({"salida_id": "La salida programada no existe."})

    if salida.cupos_disponibles < num_personas:
        raise ValidationError({
            "cupos": f"No hay suficientes cupos disponibles. Solicitados: {num_personas}, disponibles: {salida.cupos_disponibles}."
        })

    salida.cupos_disponibles -= num_personas
    salida.save(update_fields=["cupos_disponibles"])

    total = Decimal(str(salida.paquete.precio_base)) * Decimal(str(num_personas))
    codigo = generar_codigo_reserva()

    reserva = Reserva.objects.create(
        codigo=codigo,
        cliente=cliente,
        salida=salida,
        num_personas=num_personas,
        estado=Reserva.ESTADO_PENDIENTE,
        total=total,
        moneda=salida.paquete.moneda,
        canal=canal,
        conversacion_id=conversacion_id,
        registrado_por=registrado_por,
    )

    for p in pasajeros_datos:
        ReservaPasajero.objects.create(
            reserva=reserva,
            nombres=p.get("nombres", "").strip(),
            apellidos=p.get("apellidos", "").strip(),
            documento_tipo=p.get("documento_tipo"),
            documento_numero=p.get("documento_numero", "").strip() if p.get("documento_numero") else None,
            fecha_nacimiento=p.get("fecha_nacimiento"),
        )

    from apps.reservas.services.itinerarios import generar_itinerario_automatico
    from apps.reservas.services.notificaciones import registrar_notificacion_reserva

    generar_itinerario_automatico(reserva)

    registrar_notificacion_reserva(reserva)

    return reserva

@transaction.atomic
def modificar_salida_reserva(reserva_id: int, nueva_salida_id: int) -> Reserva:
    try:
        reserva = (
            Reserva.objects.select_for_update()
            .select_related("salida", "salida__paquete")
            .get(pk=reserva_id)
        )
    except Reserva.DoesNotExist:
        raise ValidationError({"reserva_id": "Reserva no encontrada."})

    if reserva.estado not in (Reserva.ESTADO_PENDIENTE, Reserva.ESTADO_CONFIRMADA):
        raise ValidationError(
            {"reserva": "Solo se pueden modificar reservas pendientes o confirmadas."}
        )
    if reserva.salida_id == nueva_salida_id:
        return reserva

    try:
        nueva = (
            PaqueteSalida.objects.select_for_update()
            .select_related("paquete")
            .get(pk=nueva_salida_id)
        )
    except PaqueteSalida.DoesNotExist:
        raise ValidationError({"salida_id": "La salida indicada no existe."})

    if nueva.paquete_id != reserva.salida.paquete_id:
        raise ValidationError(
            {"salida_id": "La nueva salida debe pertenecer al mismo paquete."}
        )
    if nueva.fecha_salida < timezone.localdate():
        raise ValidationError({"salida_id": "La nueva salida ya pasó."})
    if nueva.cupos_disponibles < reserva.num_personas:
        raise ValidationError(
            {
                "cupos": (
                    f"No hay cupos suficientes. Requeridos: {reserva.num_personas}, "
                    f"disponibles: {nueva.cupos_disponibles}."
                )
            }
        )

    anterior = PaqueteSalida.objects.select_for_update().get(pk=reserva.salida_id)
    anterior.cupos_disponibles = min(
        anterior.cupos_totales, anterior.cupos_disponibles + reserva.num_personas
    )
    anterior.save(update_fields=["cupos_disponibles"])

    nueva.cupos_disponibles -= reserva.num_personas
    nueva.save(update_fields=["cupos_disponibles"])

    reserva.salida = nueva
    reserva.total = Decimal(str(nueva.paquete.precio_base)) * Decimal(
        str(reserva.num_personas)
    )
    reserva.moneda = nueva.paquete.moneda
    reserva.save(
        update_fields=["salida", "total", "moneda", "actualizada_en"]
    )
    return reserva

@transaction.atomic
def cancelar_reserva(reserva_id: int) -> Reserva:
    reserva = obtener_reserva(reserva_id)
    if reserva.estado == Reserva.ESTADO_CANCELADA:
        return reserva

    salida = PaqueteSalida.objects.select_for_update().get(pk=reserva.salida_id)
    salida.cupos_disponibles = min(salida.cupos_totales, salida.cupos_disponibles + reserva.num_personas)
    salida.save(update_fields=["cupos_disponibles"])

    reserva.estado = Reserva.ESTADO_CANCELADA
    reserva.save(update_fields=["estado", "actualizada_en"])
    return reserva
