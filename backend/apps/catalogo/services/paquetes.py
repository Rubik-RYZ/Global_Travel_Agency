"""Capa de negocio del catálogo — paquetes turísticos y salidas programadas (CU6)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Q, QuerySet

from apps.catalogo.models import Destino, Hotel, Paquete, PaqueteSalida, Vuelo


# ─────────────────────────────────────────────────────────────────────────────
# PAQUETES
# ─────────────────────────────────────────────────────────────────────────────

def listar_paquetes(
    *,
    destino_id: int | None = None,
    solo_activos: bool = False,
    q: str | None = None,
) -> QuerySet[Paquete]:
    qs = Paquete.objects.select_related("destino", "hotel").prefetch_related("salidas").all()
    if destino_id:
        qs = qs.filter(destino_id=destino_id)
    if solo_activos:
        qs = qs.filter(activo=True)
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(descripcion__icontains=q)
            | Q(destino__nombre__icontains=q)
            | Q(etiquetas__icontains=q)
        )
    return qs.order_by("nombre")


def obtener_paquete(paquete_id: int) -> Paquete:
    try:
        return (
            Paquete.objects.select_related("destino", "hotel")
            .prefetch_related("salidas__vuelo_ida", "salidas__vuelo_vuelta")
            .get(pk=paquete_id)
        )
    except Paquete.DoesNotExist:
        raise ValidationError({"paquete_id": "Paquete turístico no encontrado."})


@transaction.atomic
def crear_paquete(
    *,
    destino_id: int,
    hotel_id: int | None = None,
    nombre: str,
    descripcion: str | None = None,
    duracion_dias: int,
    precio_base: Decimal | float,
    moneda: str = "USD",
    etiquetas: list[str] | None = None,
    activo: bool = True,
) -> Paquete:
    try:
        destino = Destino.objects.get(pk=destino_id)
    except Destino.DoesNotExist:
        raise ValidationError({"destino_id": "El destino indicado no existe."})

    hotel = None
    if hotel_id:
        try:
            hotel = Hotel.objects.get(pk=hotel_id)
        except Hotel.DoesNotExist:
            raise ValidationError({"hotel_id": "El hotel especificado no existe."})

    paquete = Paquete(
        destino=destino,
        hotel=hotel,
        nombre=nombre.strip(),
        descripcion=descripcion.strip() if descripcion else None,
        duracion_dias=duracion_dias,
        precio_base=Decimal(str(precio_base)),
        moneda=moneda,
        etiquetas=etiquetas or [],
        activo=activo,
    )
    paquete.full_clean()
    paquete.save()
    return paquete


@transaction.atomic
def actualizar_paquete(paquete_id: int, **kwargs) -> Paquete:
    paquete = obtener_paquete(paquete_id)

    if "destino_id" in kwargs:
        try:
            paquete.destino = Destino.objects.get(pk=kwargs["destino_id"])
        except Destino.DoesNotExist:
            raise ValidationError({"destino_id": "Destino no existe."})

    if "hotel_id" in kwargs:
        hotel_id = kwargs["hotel_id"]
        if hotel_id:
            try:
                paquete.hotel = Hotel.objects.get(pk=hotel_id)
            except Hotel.DoesNotExist:
                raise ValidationError({"hotel_id": "Hotel no existe."})
        else:
            paquete.hotel = None

    if "nombre" in kwargs:
        paquete.nombre = kwargs["nombre"].strip()
    if "descripcion" in kwargs:
        paquete.descripcion = kwargs["descripcion"]
    if "duracion_dias" in kwargs:
        paquete.duracion_dias = kwargs["duracion_dias"]
    if "precio_base" in kwargs:
        paquete.precio_base = Decimal(str(kwargs["precio_base"]))
    if "moneda" in kwargs:
        paquete.moneda = kwargs["moneda"]
    if "etiquetas" in kwargs:
        paquete.etiquetas = kwargs["etiquetas"]
    if "activo" in kwargs:
        paquete.activo = kwargs["activo"]

    paquete.full_clean()
    paquete.save()
    return paquete


@transaction.atomic
def eliminar_paquete(paquete_id: int) -> None:
    paquete = obtener_paquete(paquete_id)
    # Si tiene salidas con reservas
    for salida in paquete.salidas.all():
        if salida.reservas.exists():
            raise ValidationError({"paquete": "No se puede eliminar un paquete con reservas registradas."})
    paquete.delete()


# ─────────────────────────────────────────────────────────────────────────────
# SALIDAS PROGRAMADAS
# ─────────────────────────────────────────────────────────────────────────────

def listar_salidas(
    *,
    paquete_id: int | None = None,
    desde: date | str | None = None,
    solo_con_cupo: bool = False,
) -> QuerySet[PaqueteSalida]:
    qs = PaqueteSalida.objects.select_related("paquete", "vuelo_ida", "vuelo_vuelta").all()
    if paquete_id:
        qs = qs.filter(paquete_id=paquete_id)
    if desde:
        qs = qs.filter(fecha_salida__gte=desde)
    if solo_con_cupo:
        qs = qs.filter(cupos_disponibles__gt=0)
    return qs.order_by("fecha_salida")


def obtener_salida(salida_id: int) -> PaqueteSalida:
    try:
        return PaqueteSalida.objects.select_related("paquete", "vuelo_ida", "vuelo_vuelta").get(pk=salida_id)
    except PaqueteSalida.DoesNotExist:
        raise ValidationError({"salida_id": "Salida programada no encontrada."})


@transaction.atomic
def crear_salida(
    *,
    paquete_id: int,
    fecha_salida: date | str,
    vuelo_ida_id: int | None = None,
    vuelo_vuelta_id: int | None = None,
    cupos_totales: int,
    cupos_disponibles: int | None = None,
) -> PaqueteSalida:
    try:
        paquete = Paquete.objects.get(pk=paquete_id)
    except Paquete.DoesNotExist:
        raise ValidationError({"paquete_id": "El paquete indicado no existe."})

    vuelo_ida = None
    if vuelo_ida_id:
        try:
            vuelo_ida = Vuelo.objects.get(pk=vuelo_ida_id)
        except Vuelo.DoesNotExist:
            raise ValidationError({"vuelo_ida_id": "El vuelo de ida no existe."})

    vuelo_vuelta = None
    if vuelo_vuelta_id:
        try:
            vuelo_vuelta = Vuelo.objects.get(pk=vuelo_vuelta_id)
        except Vuelo.DoesNotExist:
            raise ValidationError({"vuelo_vuelta_id": "El vuelo de vuelta no existe."})

    disponibles = cupos_totales if cupos_disponibles is None else cupos_disponibles

    if PaqueteSalida.objects.filter(paquete=paquete, fecha_salida=fecha_salida).exists():
        raise ValidationError({"fecha_salida": "Ya existe una salida de este paquete para la fecha indicada."})

    salida = PaqueteSalida(
        paquete=paquete,
        fecha_salida=fecha_salida,
        vuelo_ida=vuelo_ida,
        vuelo_vuelta=vuelo_vuelta,
        cupos_totales=cupos_totales,
        cupos_disponibles=disponibles,
    )
    salida.full_clean()
    salida.save()
    return salida


@transaction.atomic
def actualizar_salida(salida_id: int, **kwargs) -> PaqueteSalida:
    salida = obtener_salida(salida_id)

    if "paquete_id" in kwargs:
        try:
            salida.paquete = Paquete.objects.get(pk=kwargs["paquete_id"])
        except Paquete.DoesNotExist:
            raise ValidationError({"paquete_id": "Paquete no existe."})

    if "fecha_salida" in kwargs:
        salida.fecha_salida = kwargs["fecha_salida"]

    if "vuelo_ida_id" in kwargs:
        v_id = kwargs["vuelo_ida_id"]
        salida.vuelo_ida = Vuelo.objects.get(pk=v_id) if v_id else None

    if "vuelo_vuelta_id" in kwargs:
        v_id = kwargs["vuelo_vuelta_id"]
        salida.vuelo_vuelta = Vuelo.objects.get(pk=v_id) if v_id else None

    if "cupos_totales" in kwargs:
        salida.cupos_totales = kwargs["cupos_totales"]
    if "cupos_disponibles" in kwargs:
        salida.cupos_disponibles = kwargs["cupos_disponibles"]

    salida.full_clean()
    salida.save()
    return salida


@transaction.atomic
def eliminar_salida(salida_id: int) -> None:
    salida = obtener_salida(salida_id)
    if salida.reservas.exists():
        raise ValidationError({"salida": "No se puede eliminar una salida que ya tiene reservas asociadas."})
    salida.delete()

