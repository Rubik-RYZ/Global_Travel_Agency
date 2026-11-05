"""Capa de negocio del catálogo — vuelos (CU4)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Q, QuerySet

from apps.catalogo.models import Aeropuerto, Proveedor, Vuelo


def listar_vuelos(
    *,
    origen: str | None = None,
    destino: str | None = None,
    fecha_salida: str | None = None,
    proveedor_id: int | None = None,
    solo_disponibles: bool = False,
    q: str | None = None,
) -> QuerySet[Vuelo]:
    """Lista vuelos con filtros por ruta, fecha, aerolínea y disponibilidad."""
    qs = Vuelo.objects.select_related("proveedor", "origen", "destino").all()
    if origen:
        qs = qs.filter(origen_id=origen.upper())
    if destino:
        qs = qs.filter(destino_id=destino.upper())
    if fecha_salida:
        qs = qs.filter(salida__date=fecha_salida)
    if proveedor_id:
        qs = qs.filter(proveedor_id=proveedor_id)
    if solo_disponibles:
        qs = qs.filter(cupos_disponibles__gt=0)
    if q:
        qs = qs.filter(
            Q(numero_vuelo__icontains=q)
            | Q(proveedor__nombre__icontains=q)
            | Q(origen__nombre__icontains=q)
            | Q(destino__nombre__icontains=q)
        )
    return qs.order_by("salida", "numero_vuelo")


def obtener_vuelo(vuelo_id: int) -> Vuelo:
    try:
        return Vuelo.objects.select_related("proveedor", "origen", "destino").get(pk=vuelo_id)
    except Vuelo.DoesNotExist:
        raise ValidationError({"vuelo_id": "Vuelo no encontrado."})


@transaction.atomic
def crear_vuelo(
    *,
    proveedor_id: int,
    numero_vuelo: str,
    origen_codigo: str,
    destino_codigo: str,
    salida: datetime,
    llegada: datetime,
    precio: Decimal | float,
    moneda: str = "USD",
    cupos_totales: int,
    cupos_disponibles: int | None = None,
    referencia_externa: str | None = None,
) -> Vuelo:
    if origen_codigo.upper() == destino_codigo.upper():
        raise ValidationError({"destino": "El aeropuerto de destino debe ser diferente al de origen."})

    if llegada <= salida:
        raise ValidationError({"llegada": "La hora de llegada debe ser posterior a la de salida."})

    if Decimal(str(precio)) < 0:
        raise ValidationError({"precio": "El precio no puede ser negativo."})

    if cupos_totales < 0:
        raise ValidationError({"cupos_totales": "Los cupos totales no pueden ser negativos."})

    disponibles = cupos_totales if cupos_disponibles is None else cupos_disponibles
    if disponibles < 0 or disponibles > cupos_totales:
        raise ValidationError({"cupos_disponibles": "Cupos disponibles no pueden ser negativos ni superar los totales."})

    try:
        proveedor = Proveedor.objects.get(pk=proveedor_id, tipo="aerolinea")
    except Proveedor.DoesNotExist:
        raise ValidationError({"proveedor_id": "El proveedor indicado no existe o no es una aerolínea."})

    try:
        origen = Aeropuerto.objects.get(pk=origen_codigo.upper())
    except Aeropuerto.DoesNotExist:
        raise ValidationError({"origen": f"Aeropuerto con código IATA '{origen_codigo}' no existe."})

    try:
        destino = Aeropuerto.objects.get(pk=destino_codigo.upper())
    except Aeropuerto.DoesNotExist:
        raise ValidationError({"destino": f"Aeropuerto con código IATA '{destino_codigo}' no existe."})

    if Vuelo.objects.filter(numero_vuelo=numero_vuelo.upper(), salida=salida).exists():
        raise ValidationError({"numero_vuelo": "Ya existe un vuelo programado con ese número y fecha/hora de salida."})

    vuelo = Vuelo(
        proveedor=proveedor,
        numero_vuelo=numero_vuelo.upper().strip(),
        origen=origen,
        destino=destino,
        salida=salida,
        llegada=llegada,
        precio=Decimal(str(precio)),
        moneda=moneda,
        cupos_totales=cupos_totales,
        cupos_disponibles=disponibles,
        referencia_externa=referencia_externa,
    )
    vuelo.full_clean()
    vuelo.save()
    return vuelo


@transaction.atomic
def actualizar_vuelo(vuelo_id: int, **kwargs) -> Vuelo:
    vuelo = obtener_vuelo(vuelo_id)

    if "proveedor_id" in kwargs:
        try:
            vuelo.proveedor = Proveedor.objects.get(pk=kwargs["proveedor_id"], tipo="aerolinea")
        except Proveedor.DoesNotExist:
            raise ValidationError({"proveedor_id": "El proveedor indicado no existe o no es una aerolínea."})

    if "origen_codigo" in kwargs:
        try:
            vuelo.origen = Aeropuerto.objects.get(pk=kwargs["origen_codigo"].upper())
        except Aeropuerto.DoesNotExist:
            raise ValidationError({"origen": "Aeropuerto de origen no existe."})

    if "destino_codigo" in kwargs:
        try:
            vuelo.destino = Aeropuerto.objects.get(pk=kwargs["destino_codigo"].upper())
        except Aeropuerto.DoesNotExist:
            raise ValidationError({"destino": "Aeropuerto de destino no existe."})

    if "numero_vuelo" in kwargs:
        vuelo.numero_vuelo = kwargs["numero_vuelo"].upper().strip()

    if "salida" in kwargs:
        vuelo.salida = kwargs["salida"]
    if "llegada" in kwargs:
        vuelo.llegada = kwargs["llegada"]
    if "precio" in kwargs:
        vuelo.precio = Decimal(str(kwargs["precio"]))
    if "moneda" in kwargs:
        vuelo.moneda = kwargs["moneda"]
    if "cupos_totales" in kwargs:
        vuelo.cupos_totales = kwargs["cupos_totales"]
    if "cupos_disponibles" in kwargs:
        vuelo.cupos_disponibles = kwargs["cupos_disponibles"]
    if "referencia_externa" in kwargs:
        vuelo.referencia_externa = kwargs["referencia_externa"]

    vuelo.full_clean()
    vuelo.save()
    return vuelo


@transaction.atomic
def eliminar_vuelo(vuelo_id: int) -> None:
    vuelo = obtener_vuelo(vuelo_id)
    # Si está asignado a salidas programadas protegidas
    if vuelo.salidas_ida.exists() or vuelo.salidas_vuelta.exists():
        raise ValidationError({"vuelo": "No se puede eliminar un vuelo asignado a salidas programadas de paquetes."})
    vuelo.delete()

