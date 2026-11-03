"""Capa de negocio del catálogo — vuelos (CU4)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Vuelo

# Campos editables de un vuelo (los del serializer de escritura).
CAMPOS_VUELO = {
    "proveedor", "numero_vuelo", "origen", "destino", "salida", "llegada",
    "precio", "moneda", "cupos_totales", "cupos_disponibles",
    "referencia_externa",
}


def listar_vuelos(
    *,
    proveedor_id=None,
    origen: str | None = None,
    destino: str | None = None,
    desde: str | None = None,
    hasta: str | None = None,
    solo_disponibles: bool = False,
    q: str | None = None,
) -> "QuerySet[Vuelo]":
    """Devuelve vuelos filtrados por proveedor, ruta, fecha o texto."""
    qs = Vuelo.objects.select_related("proveedor", "origen", "destino")
    if proveedor_id:
        qs = qs.filter(proveedor_id=proveedor_id)
    if origen:
        qs = qs.filter(origen_id=origen)
    if destino:
        qs = qs.filter(destino_id=destino)
    if desde:
        qs = qs.filter(salida__date__gte=desde)
    if hasta:
        qs = qs.filter(salida__date__lte=hasta)
    if solo_disponibles:
        qs = qs.filter(cupos_disponibles__gt=0)
    if q:
        qs = qs.filter(
            Q(numero_vuelo__icontains=q)
            | Q(proveedor__nombre__icontains=q)
            | Q(origen__nombre__icontains=q)
            | Q(destino__nombre__icontains=q)
        )
    return qs.order_by("salida")


def obtener_vuelo(vuelo_id: int) -> Vuelo:
    try:
        return Vuelo.objects.select_related(
            "proveedor", "origen", "destino"
        ).get(pk=vuelo_id)
    except Vuelo.DoesNotExist:
        raise ValidationError({"vuelo_id": "Vuelo no encontrado."})


def _validar(datos: dict, *, instance: Vuelo | None = None) -> None:
    """Reglas de negocio del vuelo (mismas que el CHECK del esquema)."""
    proveedor = datos.get("proveedor", getattr(instance, "proveedor", None))
    origen = datos.get("origen", getattr(instance, "origen", None))
    destino = datos.get("destino", getattr(instance, "destino", None))
    salida = datos.get("salida", getattr(instance, "salida", None))
    llegada = datos.get("llegada", getattr(instance, "llegada", None))
    totales = datos.get("cupos_totales", getattr(instance, "cupos_totales", None))
    disponibles = datos.get(
        "cupos_disponibles", getattr(instance, "cupos_disponibles", None)
    )
    precio = datos.get("precio", getattr(instance, "precio", None))

    if proveedor is not None and proveedor.tipo != "aerolinea":
        raise ValidationError(
            {"proveedor": "El proveedor del vuelo debe ser una aerolínea."}
        )
    if origen is not None and destino is not None and origen.pk == destino.pk:
        raise ValidationError(
            {"destino": "El destino debe ser distinto del origen."}
        )
    if salida is not None and llegada is not None and llegada <= salida:
        raise ValidationError(
            {"llegada": "La llegada debe ser posterior a la salida."}
        )
    if totales is not None and totales < 0:
        raise ValidationError(
            {"cupos_totales": "Los cupos totales no pueden ser negativos."}
        )
    if disponibles is not None and disponibles < 0:
        raise ValidationError(
            {"cupos_disponibles": "Los cupos disponibles no pueden ser negativos."}
        )
    if totales is not None and disponibles is not None and disponibles > totales:
        raise ValidationError(
            {"cupos_disponibles": "No puede superar los cupos totales."}
        )
    if precio is not None and precio < 0:
        raise ValidationError({"precio": "El precio no puede ser negativo."})


@transaction.atomic
def crear_vuelo(**datos) -> Vuelo:
    datos = {k: v for k, v in datos.items() if k in CAMPOS_VUELO}
    if datos.get("cupos_disponibles") is None:
        datos["cupos_disponibles"] = datos.get("cupos_totales", 0)
    _validar(datos)
    vuelo = Vuelo(**datos)
    vuelo.save()
    return vuelo


@transaction.atomic
def actualizar_vuelo(vuelo_id: int, **kwargs) -> Vuelo:
    vuelo = obtener_vuelo(vuelo_id)
    cambios = {k: v for k, v in kwargs.items() if k in CAMPOS_VUELO}
    _validar(cambios, instance=vuelo)
    for campo, valor in cambios.items():
        setattr(vuelo, campo, valor)
    vuelo.save()
    return vuelo