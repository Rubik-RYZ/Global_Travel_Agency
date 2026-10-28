"""Capa de negocio del catálogo turístico (CU3)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.catalogo.models import Destino, ItinerarioDia, Proveedor

# Campos comerciales editables de un destino (los del serializer de escritura).
CAMPOS_DESTINO = {
    "nombre", "pais", "pais_codigo", "region", "resumen", "descripcion",
    "latitud", "longitud", "duracion_dias", "duracion_noches",
    "precio_desde", "moneda", "mejor_epoca", "caracter",
    "imagen_principal", "incluye", "no_incluye", "etiquetas",
    "destacado", "activo",
}


# ── Destinos ────────────────────────────────────────────────────────────────

def listar_destinos(
    *,
    solo_activos: bool = True,
    pais: str | None = None,
    region: str | None = None,
    caracter: str | None = None,
    etiqueta: str | None = None,
    solo_destacados: bool = False,
    q: str | None = None,
) -> "QuerySet[Destino]":
    """Devuelve destinos filtrados. Público: solo_activos=True."""
    qs = Destino.objects.all()
    if solo_activos:
        qs = qs.filter(activo=True)
    if pais:
        qs = qs.filter(pais__iexact=pais)
    if region:
        qs = qs.filter(region=region)
    if caracter:
        qs = qs.filter(caracter=caracter)
    if solo_destacados:
        qs = qs.filter(destacado=True)
    if etiqueta:
        qs = qs.filter(etiquetas__contains=[etiqueta])
    if q:
        qs = qs.filter(
            Q(nombre__icontains=q)
            | Q(pais__icontains=q)
            | Q(resumen__icontains=q)
            | Q(descripcion__icontains=q)
        )
    return qs.order_by("-destacado", "pais", "nombre")


def obtener_destino(destino_id: int) -> Destino:
    try:
        return Destino.objects.get(pk=destino_id)
    except Destino.DoesNotExist:
        raise ValidationError({"destino_id": "Destino no encontrado."})


@transaction.atomic
def crear_destino(*, nombre: str, pais: str, **campos) -> Destino:
    if Destino.objects.filter(nombre=nombre, pais=pais).exists():
        raise ValidationError({"nombre": "Ya existe un destino con ese nombre en ese país."})
    datos = {k: v for k, v in campos.items() if k in CAMPOS_DESTINO}
    destino = Destino(nombre=nombre, pais=pais, **datos)
    destino.full_clean(exclude=["slug"])
    destino.save()
    return destino


@transaction.atomic
def actualizar_destino(destino_id: int, **kwargs) -> Destino:
    destino = obtener_destino(destino_id)
    for campo, valor in kwargs.items():
        if campo in CAMPOS_DESTINO:
            setattr(destino, campo, valor)
    # Verificar unicidad si cambia nombre o país
    nombre = kwargs.get("nombre", destino.nombre)
    pais = kwargs.get("pais", destino.pais)
    if Destino.objects.filter(nombre=nombre, pais=pais).exclude(pk=destino_id).exists():
        raise ValidationError({"nombre": "Ya existe un destino con ese nombre en ese país."})
    destino.full_clean(exclude=["slug"])
    destino.save()
    return destino


@transaction.atomic
def toggle_activo_destino(destino_id: int) -> Destino:
    destino = obtener_destino(destino_id)
    destino.activo = not destino.activo
    destino.save(update_fields=["activo"])
    return destino


@transaction.atomic
def definir_itinerario(destino_id: int, dias: list[dict]) -> list[ItinerarioDia]:
    """Reemplaza el itinerario día a día de un destino."""
    destino = obtener_destino(destino_id)

    numeros = [d.get("numero_dia") for d in dias]
    if any(n is None or int(n) < 1 for n in numeros):
        raise ValidationError({"numero_dia": "Cada día debe indicar un número mayor que cero."})
    if len(set(numeros)) != len(numeros):
        raise ValidationError({"numero_dia": "No puede haber dos días con el mismo número."})
    if any(not (d.get("titulo") or "").strip() for d in dias):
        raise ValidationError({"titulo": "Cada día del itinerario necesita un título."})

    destino.itinerario.all().delete()
    creados = [
        ItinerarioDia.objects.create(
            destino=destino,
            numero_dia=d["numero_dia"],
            titulo=d["titulo"],
            descripcion=d.get("descripcion"),
            ubicacion=d.get("ubicacion"),
        )
        for d in sorted(dias, key=lambda x: x["numero_dia"])
    ]
    return creados


# ── Proveedores ─────────────────────────────────────────────────────────────

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
                    notas: str | None = None) -> Proveedor:
    if Proveedor.objects.filter(nombre=nombre).exists():
        raise ValidationError({"nombre": "Ya existe un proveedor con ese nombre."})
    return Proveedor.objects.create(
        nombre=nombre, tipo=tipo, pais=pais, ciudad=ciudad,
        contacto=contacto, email=email, telefono=telefono, notas=notas,
    )


@transaction.atomic
def actualizar_proveedor(proveedor_id: int, **kwargs) -> Proveedor:
    proveedor = obtener_proveedor(proveedor_id)
    campos_permitidos = {
        "nombre", "tipo", "pais", "ciudad", "contacto",
        "email", "telefono", "notas", "activo",
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
