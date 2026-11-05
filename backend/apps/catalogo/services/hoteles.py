"""Capa de negocio del catálogo — hoteles y habitaciones (CU5)."""
from __future__ import annotations

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q, QuerySet

from apps.catalogo.models import Destino, Habitacion, Hotel, Proveedor


# ─────────────────────────────────────────────────────────────────────────────
# HOTELES
# ─────────────────────────────────────────────────────────────────────────────

def listar_hoteles(
    *,
    destino_id: int | None = None,
    proveedor_id: int | None = None,
    solo_activos: bool = False,
    estrellas: int | None = None,
    q: str | None = None,
) -> QuerySet[Hotel]:
    qs = Hotel.objects.select_related("proveedor", "destino").prefetch_related("habitaciones").all()
    if destino_id:
        qs = qs.filter(destino_id=destino_id)
    if proveedor_id:
        qs = qs.filter(proveedor_id=proveedor_id)
    if solo_activos:
        qs = qs.filter(activo=True)
    if estrellas:
        qs = qs.filter(estrellas=estrellas)
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(direccion__icontains=q)
            | Q(descripcion__icontains=q)
            | Q(destino__nombre__icontains=q)
            | Q(proveedor__nombre__icontains=q)
        )
    return qs.order_by("nombre")


def obtener_hotel(hotel_id: int) -> Hotel:
    try:
        return Hotel.objects.select_related("proveedor", "destino").prefetch_related("habitaciones").get(pk=hotel_id)
    except Hotel.DoesNotExist:
        raise ValidationError({"hotel_id": "Hotel no encontrado."})


@transaction.atomic
def crear_hotel(
    *,
    proveedor_id: int,
    destino_id: int,
    nombre: str,
    estrellas: int | None = None,
    direccion: str | None = None,
    latitud: Decimal | float | None = None,
    longitud: Decimal | float | None = None,
    descripcion: str | None = None,
    activo: bool = True,
) -> Hotel:
    try:
        proveedor = Proveedor.objects.get(pk=proveedor_id, tipo="hotel")
    except Proveedor.DoesNotExist:
        raise ValidationError({"proveedor_id": "El proveedor indicado no existe o no es de tipo hotel."})

    try:
        destino = Destino.objects.get(pk=destino_id)
    except Destino.DoesNotExist:
        raise ValidationError({"destino_id": "El destino indicado no existe."})

    hotel = Hotel(
        proveedor=proveedor,
        destino=destino,
        nombre=nombre.strip(),
        estrellas=estrellas,
        direccion=direccion.strip() if direccion else None,
        latitud=Decimal(str(latitud)) if latitud is not None else None,
        longitud=Decimal(str(longitud)) if longitud is not None else None,
        descripcion=descripcion.strip() if descripcion else None,
        activo=activo,
    )
    hotel.full_clean()
    hotel.save()
    return hotel


@transaction.atomic
def actualizar_hotel(hotel_id: int, **kwargs) -> Hotel:
    hotel = obtener_hotel(hotel_id)

    if "proveedor_id" in kwargs:
        try:
            hotel.proveedor = Proveedor.objects.get(pk=kwargs["proveedor_id"], tipo="hotel")
        except Proveedor.DoesNotExist:
            raise ValidationError({"proveedor_id": "Proveedor no existe o no es de tipo hotel."})

    if "destino_id" in kwargs:
        try:
            hotel.destino = Destino.objects.get(pk=kwargs["destino_id"])
        except Destino.DoesNotExist:
            raise ValidationError({"destino_id": "Destino no existe."})

    if "nombre" in kwargs:
        hotel.nombre = kwargs["nombre"].strip()
    if "estrellas" in kwargs:
        hotel.estrellas = kwargs["estrellas"]
    if "direccion" in kwargs:
        hotel.direccion = kwargs["direccion"]
    if "latitud" in kwargs:
        hotel.latitud = Decimal(str(kwargs["latitud"])) if kwargs["latitud"] is not None else None
    if "longitud" in kwargs:
        hotel.longitud = Decimal(str(kwargs["longitud"])) if kwargs["longitud"] is not None else None
    if "descripcion" in kwargs:
        hotel.descripcion = kwargs["descripcion"]
    if "activo" in kwargs:
        hotel.activo = kwargs["activo"]

    hotel.full_clean()
    hotel.save()
    return hotel


@transaction.atomic
def eliminar_hotel(hotel_id: int) -> None:
    hotel = obtener_hotel(hotel_id)
    if hotel.paquetes.exists():
        raise ValidationError({"hotel": "No se puede eliminar un hotel asignado a paquetes turísticos."})
    hotel.delete()


# ─────────────────────────────────────────────────────────────────────────────
# HABITACIONES
# ─────────────────────────────────────────────────────────────────────────────

def listar_habitaciones(*, hotel_id: int | None = None) -> QuerySet[Habitacion]:
    qs = Habitacion.objects.select_related("hotel").all()
    if hotel_id:
        qs = qs.filter(hotel_id=hotel_id)
    return qs.order_by("hotel", "precio_noche")


def obtener_habitacion(habitacion_id: int) -> Habitacion:
    try:
        return Habitacion.objects.select_related("hotel").get(pk=habitacion_id)
    except Habitacion.DoesNotExist:
        raise ValidationError({"habitacion_id": "Habitación no encontrada."})


@transaction.atomic
def crear_habitacion(
    *,
    hotel_id: int,
    tipo: str,
    capacidad: int,
    precio_noche: Decimal | float,
    moneda: str = "USD",
) -> Habitacion:
    try:
        hotel = Hotel.objects.get(pk=hotel_id)
    except Hotel.DoesNotExist:
        raise ValidationError({"hotel_id": "El hotel especificado no existe."})

    habitacion = Habitacion(
        hotel=hotel,
        tipo=tipo.strip(),
        capacidad=capacidad,
        precio_noche=Decimal(str(precio_noche)),
        moneda=moneda,
    )
    habitacion.full_clean()
    habitacion.save()
    return habitacion


@transaction.atomic
def actualizar_habitacion(habitacion_id: int, **kwargs) -> Habitacion:
    habitacion = obtener_habitacion(habitacion_id)

    if "hotel_id" in kwargs:
        try:
            habitacion.hotel = Hotel.objects.get(pk=kwargs["hotel_id"])
        except Hotel.DoesNotExist:
            raise ValidationError({"hotel_id": "Hotel no existe."})

    if "tipo" in kwargs:
        habitacion.tipo = kwargs["tipo"].strip()
    if "capacidad" in kwargs:
        habitacion.capacidad = kwargs["capacidad"]
    if "precio_noche" in kwargs:
        habitacion.precio_noche = Decimal(str(kwargs["precio_noche"]))
    if "moneda" in kwargs:
        habitacion.moneda = kwargs["moneda"]

    habitacion.full_clean()
    habitacion.save()
    return habitacion


@transaction.atomic
def eliminar_habitacion(habitacion_id: int) -> None:
    habitacion = obtener_habitacion(habitacion_id)
    habitacion.delete()

