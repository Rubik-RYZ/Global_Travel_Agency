"""Capa de negocio del catálogo — hoteles (CU5)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Hotel

# Campos editables de un hotel (los del serializer de escritura).
CAMPOS_HOTEL = {
    "proveedor", "destino", "nombre", "estrellas", "direccion",
    "latitud", "longitud", "descripcion", "activo",
}


def listar_hoteles(
    *,
    solo_activos: bool = False,
    proveedor_id=None,
    destino_id=None,
    estrellas: int | None = None,
    q: str | None = None,
) -> "QuerySet[Hotel]":
    """Devuelve hoteles filtrados por proveedor, destino, categoría o texto."""
    qs = Hotel.objects.select_related("proveedor", "destino")
    if solo_activos:
        qs = qs.filter(activo=True)
    if proveedor_id:
        qs = qs.filter(proveedor_id=proveedor_id)
    if destino_id:
        qs = qs.filter(destino_id=destino_id)
    if estrellas:
        qs = qs.filter(estrellas=estrellas)
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(direccion__icontains=q)
            | Q(proveedor__nombre__icontains=q)
            | Q(destino__nombre__icontains=q)
        )
    return qs.order_by("nombre")


def obtener_hotel(hotel_id: int) -> Hotel:
    try:
        return Hotel.objects.select_related("proveedor", "destino").get(pk=hotel_id)
    except Hotel.DoesNotExist:
        raise ValidationError({"hotel_id": "Hotel no encontrado."})


def _validar(datos: dict, *, instance: Hotel | None = None) -> None:
    """Reglas de negocio del hotel (mismas que los CHECK del esquema)."""
    proveedor = datos.get("proveedor", getattr(instance, "proveedor", None))
    nombre = datos.get("nombre", getattr(instance, "nombre", None))
    estrellas = datos.get("estrellas", getattr(instance, "estrellas", None))
    latitud = datos.get("latitud", getattr(instance, "latitud", None))
    longitud = datos.get("longitud", getattr(instance, "longitud", None))

    if proveedor is not None and proveedor.tipo != "hotel":
        raise ValidationError(
            {"proveedor": "El proveedor del hotel debe ser de tipo hotel."}
        )
    if nombre is not None and not str(nombre).strip():
        raise ValidationError({"nombre": "El nombre del hotel es obligatorio."})
    if estrellas is not None and not 1 <= estrellas <= 5:
        raise ValidationError(
            {"estrellas": "La categoría debe estar entre 1 y 5 estrellas."}
        )
    if latitud is not None and not -90 <= float(latitud) <= 90:
        raise ValidationError({"latitud": "La latitud debe estar entre -90 y 90."})
    if longitud is not None and not -180 <= float(longitud) <= 180:
        raise ValidationError(
            {"longitud": "La longitud debe estar entre -180 y 180."}
        )


@transaction.atomic
def crear_hotel(**datos) -> Hotel:
    datos = {k: v for k, v in datos.items() if k in CAMPOS_HOTEL}
    _validar(datos)
    hotel = Hotel(**datos)
    hotel.save()
    return hotel


@transaction.atomic
def actualizar_hotel(hotel_id: int, **kwargs) -> Hotel:
    hotel = obtener_hotel(hotel_id)
    cambios = {k: v for k, v in kwargs.items() if k in CAMPOS_HOTEL}
    _validar(cambios, instance=hotel)
    for campo, valor in cambios.items():
        setattr(hotel, campo, valor)
    hotel.save()
    return hotel


@transaction.atomic
def toggle_activo_hotel(hotel_id: int) -> Hotel:
    hotel = obtener_hotel(hotel_id)
    hotel.activo = not hotel.activo
    hotel.save(update_fields=["activo"])
    return hotel