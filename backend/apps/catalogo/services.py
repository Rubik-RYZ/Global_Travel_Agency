"""Capa de negocio del catálogo turístico (CU3)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Destino, Proveedor


# ── Destinos ────────────────────────────────────────────────────────────────

def listar_destinos(
    *,
    solo_activos: bool = True,
    pais: str | None = None,
    etiqueta: str | None = None,
    q: str | None = None,
) -> "QuerySet[Destino]":
    """Devuelve destinos filtrados. Público: solo_activos=True."""
    qs = Destino.objects.all()
    if solo_activos:
        qs = qs.filter(activo=True)
    if pais:
        qs = qs.filter(pais__iexact=pais)
    if etiqueta:
        qs = qs.filter(etiquetas__contains=[etiqueta])
    if q:
        qs = qs.filter(Q(nombre__icontains=q) | Q(pais__icontains=q) | Q(descripcion__icontains=q))
    return qs.order_by("pais", "nombre")


def obtener_destino(destino_id: int) -> Destino:
    try:
        return Destino.objects.get(pk=destino_id)
    except Destino.DoesNotExist:
        raise ValidationError({"destino_id": "Destino no encontrado."})


@transaction.atomic
def crear_destino(*, nombre: str, pais: str, descripcion: str | None = None,
                  latitud=None, longitud=None, etiquetas: list[str] | None = None) -> Destino:
    if Destino.objects.filter(nombre=nombre, pais=pais).exists():
        raise ValidationError({"nombre": "Ya existe un destino con ese nombre en ese país."})
    destino = Destino.objects.create(
        nombre=nombre,
        pais=pais,
        descripcion=descripcion,
        latitud=latitud,
        longitud=longitud,
        etiquetas=etiquetas or [],
    )
    return destino


@transaction.atomic
def actualizar_destino(destino_id: int, **kwargs) -> Destino:
    destino = obtener_destino(destino_id)
    campos_permitidos = {"nombre", "pais", "descripcion", "latitud", "longitud", "etiquetas", "activo"}
    for campo, valor in kwargs.items():
        if campo in campos_permitidos:
            setattr(destino, campo, valor)
    # Verificar unicidad si cambia nombre o país
    nombre = kwargs.get("nombre", destino.nombre)
    pais = kwargs.get("pais", destino.pais)
    if Destino.objects.filter(nombre=nombre, pais=pais).exclude(pk=destino_id).exists():
        raise ValidationError({"nombre": "Ya existe un destino con ese nombre en ese país."})
    destino.save()
    return destino


@transaction.atomic
def toggle_activo_destino(destino_id: int) -> Destino:
    destino = obtener_destino(destino_id)
    destino.activo = not destino.activo
    destino.save(update_fields=["activo"])
    return destino


# ── Proveedores ─────────────────────────────────────────────────────────────

def listar_proveedores(
    *,
    solo_activos: bool = False,
    tipo: str | None = None,
    q: str | None = None,
) -> "QuerySet[Proveedor]":
    qs = Proveedor.objects.all()
    if solo_activos:
        qs = qs.filter(activo=True)
    if tipo:
        qs = qs.filter(tipo=tipo)
    if q:
        qs = qs.filter(Q(nombre__icontains=q) | Q(email__icontains=q))
    return qs.order_by("tipo", "nombre")


def obtener_proveedor(proveedor_id: int) -> Proveedor:
    try:
        return Proveedor.objects.get(pk=proveedor_id)
    except Proveedor.DoesNotExist:
        raise ValidationError({"proveedor_id": "Proveedor no encontrado."})


@transaction.atomic
def crear_proveedor(*, nombre: str, tipo: str, email: str | None = None,
                    telefono: str | None = None) -> Proveedor:
    if Proveedor.objects.filter(nombre=nombre).exists():
        raise ValidationError({"nombre": "Ya existe un proveedor con ese nombre."})
    return Proveedor.objects.create(nombre=nombre, tipo=tipo, email=email, telefono=telefono)


@transaction.atomic
def actualizar_proveedor(proveedor_id: int, **kwargs) -> Proveedor:
    proveedor = obtener_proveedor(proveedor_id)
    campos_permitidos = {"nombre", "tipo", "email", "telefono", "activo"}
    for campo, valor in kwargs.items():
        if campo in campos_permitidos:
            setattr(proveedor, campo, valor)
    nombre = kwargs.get("nombre", proveedor.nombre)
    if Proveedor.objects.filter(nombre=nombre).exclude(pk=proveedor_id).exists():
        raise ValidationError({"nombre": "Ya existe un proveedor con ese nombre."})
    proveedor.save()
    return proveedor


@transaction.atomic
def toggle_activo_proveedor(proveedor_id: int) -> Proveedor:
    proveedor = obtener_proveedor(proveedor_id)
    proveedor.activo = not proveedor.activo
    proveedor.save(update_fields=["activo"])
    return proveedor
