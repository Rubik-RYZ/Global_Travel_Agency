"""Capa de negocio del catálogo — paquetes y salidas (CU6)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Paquete, PaqueteSalida

# Campos editables de un paquete (los del serializer de escritura).
CAMPOS_PAQUETE = {
    "destino", "hotel", "nombre", "descripcion", "duracion_dias",
    "precio_base", "moneda", "etiquetas", "activo",
}

# Campos editables de una salida.
CAMPOS_SALIDA = {
    "paquete", "fecha_salida", "vuelo_ida", "vuelo_vuelta",
    "cupos_totales", "cupos_disponibles",
}


def listar_paquetes(
    *,
    solo_activos: bool = False,
    destino_id=None,
    hotel_id=None,
    etiqueta: str | None = None,
    q: str | None = None,
) -> "QuerySet[Paquete]":
    """Devuelve paquetes filtrados por destino, hotel, etiqueta o texto."""
    qs = Paquete.objects.select_related("destino", "hotel").prefetch_related(
        "salidas"
    )
    if solo_activos:
        qs = qs.filter(activo=True)
    if destino_id:
        qs = qs.filter(destino_id=destino_id)
    if hotel_id:
        qs = qs.filter(hotel_id=hotel_id)
    if etiqueta:
        qs = qs.filter(etiquetas__contains=[etiqueta])
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(descripcion__icontains=q)
            | Q(destino__nombre__icontains=q)
        )
    return qs.order_by("destino__nombre", "nombre")


def obtener_paquete(paquete_id: int) -> Paquete:
    try:
        return Paquete.objects.select_related("destino", "hotel").get(pk=paquete_id)
    except Paquete.DoesNotExist:
        raise ValidationError({"paquete_id": "Paquete no encontrado."})


def _validar_paquete(datos: dict, *, instance: Paquete | None = None) -> None:
    nombre = datos.get("nombre", getattr(instance, "nombre", None))
    duracion = datos.get("duracion_dias", getattr(instance, "duracion_dias", None))
    precio = datos.get("precio_base", getattr(instance, "precio_base", None))

    if nombre is not None and not str(nombre).strip():
        raise ValidationError({"nombre": "El nombre del paquete es obligatorio."})
    if duracion is not None and duracion <= 0:
        raise ValidationError(
            {"duracion_dias": "La duración debe ser mayor que cero."}
        )
    if precio is not None and precio < 0:
        raise ValidationError({"precio_base": "El precio no puede ser negativo."})


@transaction.atomic
def crear_paquete(**datos) -> Paquete:
    datos = {k: v for k, v in datos.items() if k in CAMPOS_PAQUETE}
    _validar_paquete(datos)
    paquete = Paquete(**datos)
    paquete.save()
    return paquete


@transaction.atomic
def actualizar_paquete(paquete_id: int, **kwargs) -> Paquete:
    paquete = obtener_paquete(paquete_id)
    cambios = {k: v for k, v in kwargs.items() if k in CAMPOS_PAQUETE}
    _validar_paquete(cambios, instance=paquete)
    for campo, valor in cambios.items():
        setattr(paquete, campo, valor)
    paquete.save()
    return paquete


@transaction.atomic
def toggle_activo_paquete(paquete_id: int) -> Paquete:
    paquete = obtener_paquete(paquete_id)
    paquete.activo = not paquete.activo
    paquete.save(update_fields=["activo"])
    return paquete


# ── Salidas ──────────────────────────────────────────────────────────────────

def listar_salidas(
    *,
    paquete_id=None,
    desde: str | None = None,
    hasta: str | None = None,
    solo_disponibles: bool = False,
) -> "QuerySet[PaqueteSalida]":
    """Devuelve salidas filtradas por paquete, rango de fechas y cupos."""
    qs = PaqueteSalida.objects.select_related(
        "paquete", "vuelo_ida", "vuelo_vuelta"
    )
    if paquete_id:
        qs = qs.filter(paquete_id=paquete_id)
    if desde:
        qs = qs.filter(fecha_salida__gte=desde)
    if hasta:
        qs = qs.filter(fecha_salida__lte=hasta)
    if solo_disponibles:
        qs = qs.filter(cupos_disponibles__gt=0)
    return qs.order_by("fecha_salida")


def obtener_salida(salida_id: int) -> PaqueteSalida:
    try:
        return PaqueteSalida.objects.select_related(
            "paquete", "vuelo_ida", "vuelo_vuelta"
        ).get(pk=salida_id)
    except PaqueteSalida.DoesNotExist:
        raise ValidationError({"salida_id": "Salida no encontrada."})


def _validar_salida(datos: dict, *, instance: PaqueteSalida | None = None) -> None:
    paquete = datos.get("paquete", getattr(instance, "paquete", None))
    fecha = datos.get("fecha_salida", getattr(instance, "fecha_salida", None))
    totales = datos.get(
        "cupos_totales", getattr(instance, "cupos_totales", None)
    )
    disponibles = datos.get(
        "cupos_disponibles", getattr(instance, "cupos_disponibles", None)
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
    if paquete is not None and fecha is not None:
        repetida = PaqueteSalida.objects.filter(
            paquete=paquete, fecha_salida=fecha
        )
        if instance is not None:
            repetida = repetida.exclude(pk=instance.pk)
        if repetida.exists():
            raise ValidationError(
                {"fecha_salida": "Ya existe una salida para esa fecha."}
            )


@transaction.atomic
def crear_salida(**datos) -> PaqueteSalida:
    datos = {k: v for k, v in datos.items() if k in CAMPOS_SALIDA}
    if datos.get("cupos_disponibles") is None:
        datos["cupos_disponibles"] = datos.get("cupos_totales", 0)
    _validar_salida(datos)
    salida = PaqueteSalida(**datos)
    salida.save()
    return salida


@transaction.atomic
def actualizar_salida(salida_id: int, **kwargs) -> PaqueteSalida:
    salida = obtener_salida(salida_id)
    cambios = {k: v for k, v in kwargs.items() if k in CAMPOS_SALIDA}
    _validar_salida(cambios, instance=salida)
    for campo, valor in cambios.items():
        setattr(salida, campo, valor)
    salida.save()
    return salida


@transaction.atomic
def eliminar_salida(salida_id: int) -> None:
    salida = obtener_salida(salida_id)
    salida.delete()