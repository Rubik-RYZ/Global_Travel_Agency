"""Capa de negocio del catálogo — proveedores (CU3)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Proveedor


def listar_proveedores(
    *,
    solo_activos: bool = False,
    tipo: str | None = None,
    pais: str | None = None,
    q: str | None = None,
) -> "QuerySet[Proveedor]":
    qs = Proveedor.objects.all()
    if solo_activos:
        qs = qs.filter(activo=True)
    if tipo:
        qs = qs.filter(tipo=tipo)
    if pais:
        qs = qs.filter(pais__iexact=pais)
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(email__icontains=q)
            | Q(ciudad__icontains=q)
            | Q(contacto__icontains=q)
        )
    return qs.order_by("tipo", "nombre")


def obtener_proveedor(proveedor_id: int) -> Proveedor:
    try:
        return Proveedor.objects.get(pk=proveedor_id)
    except Proveedor.DoesNotExist:
        raise ValidationError({"proveedor_id": "Proveedor no encontrado."})


@transaction.atomic
def crear_proveedor(*, nombre: str, tipo: str, pais: str | None = None,
                    ciudad: str | None = None, contacto: str | None = None,
                    email: str | None = None, telefono: str | None = None,
                    notas: str | None = None,
                    logo_url: str | None = None,
                    logo_public_id: str | None = None) -> Proveedor:
    if Proveedor.objects.filter(nombre=nombre).exists():
        raise ValidationError({"nombre": "Ya existe un proveedor con ese nombre."})
    return Proveedor.objects.create(
        nombre=nombre, tipo=tipo, pais=pais, ciudad=ciudad,
        contacto=contacto, email=email, telefono=telefono, notas=notas,
        logo_url=logo_url, logo_public_id=logo_public_id,
    )


@transaction.atomic
def actualizar_proveedor(proveedor_id: int, **kwargs) -> Proveedor:
    proveedor = obtener_proveedor(proveedor_id)
    campos_permitidos = {
        "nombre", "tipo", "pais", "ciudad", "contacto",
        "email", "telefono", "notas",
        "logo_url", "logo_public_id", "activo",
    }
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
