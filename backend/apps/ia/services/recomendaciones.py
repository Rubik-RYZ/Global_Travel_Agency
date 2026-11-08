"""Recomendador content-based de paquetes turísticos (CU11).

El puntaje combina los intereses declarados por el cliente, su presupuesto,
la disponibilidad de salidas futuras y la popularidad histórica del paquete.
Cada ejecución queda registrada en ``recomendaciones`` para medir su calidad.
"""
from __future__ import annotations

import unicodedata
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.catalogo.models import Paquete
from apps.ia.models import ModeloIA, Recomendacion
from apps.reservas.models import Reserva
from apps.usuarios.models import Cliente, ClientePreferencia

NOMBRE_MODELO = "recomendador-contenido"
VERSION_MODELO = "1.0"
TTL_RECOMENDACIONES = timedelta(hours=6)

ALIASES = {
    "playa": ("playa", "costa", "mar", "isla", "mediterraneo", "tirreno"),
    "cultural": ("cultural", "cultura", "patrimonio", "museo", "arquitectura"),
    "aventura": ("aventura", "trekking", "senderismo", "glaciar", "desierto"),
    "gastronomia": ("gastronomia", "gastronomico", "comida", "cocina", "mercado"),
    "naturaleza": ("naturaleza", "natural", "parque", "salar", "montana", "altiplano"),
    "compras": ("compras", "zoco", "mercado", "artesania", "shopping"),
    "romantico": ("romantico", "romantica", "pareja", "luna de miel"),
    "familiar": ("familiar", "familia", "ninos", "infantil"),
    "historico": ("historico", "historia", "inca", "arqueologia", "precolombino"),
    "nocturno": ("nocturno", "noche", "vida nocturna"),
}


def _normalizar(texto: str | None) -> str:
    """Minúsculas y sin acentos para comparar etiquetas."""
    base = unicodedata.normalize("NFKD", (texto or "").lower())
    return "".join(caracter for caracter in base if not unicodedata.combining(caracter))


def _texto_busqueda(paquete: Paquete) -> str:
    destino = paquete.destino
    partes = [
        paquete.nombre,
        paquete.descripcion,
        destino.nombre,
        destino.pais,
        destino.region,
        destino.caracter,
        destino.resumen,
        destino.lema,
        " ".join(paquete.etiquetas or []),
        " ".join(destino.etiquetas or []),
    ]
    return _normalizar(" ".join(parte or "" for parte in partes))


def _modelo_recomendador() -> ModeloIA:
    """Modelo lógico del recomendador, estable entre ejecuciones."""
    modelo, _ = ModeloIA.objects.get_or_create(
        nombre=NOMBRE_MODELO,
        version=VERSION_MODELO,
        defaults={
            "tipo": ModeloIA.TIPO_RECOMENDADOR,
            "metricas": {"algoritmo": "content-based", "intereses": list(ALIASES)},
            "activo": True,
        },
    )
    if not modelo.activo:
        modelo.activo = True
        modelo.save(update_fields=["activo"])
    ModeloIA.objects.filter(tipo=ModeloIA.TIPO_RECOMENDADOR).exclude(
        pk=modelo.pk
    ).update(activo=False)
    return modelo


def _popularidad() -> dict[int, int]:
    """Reservas no canceladas por paquete, para desempatar recomendaciones."""
    filas = (
        Reserva.objects.exclude(estado=Reserva.ESTADO_CANCELADA)
        .values("salida__paquete_id")
        .annotate(total=Count("id"))
    )
    return {
        fila["salida__paquete_id"]: fila["total"]
        for fila in filas
        if fila["salida__paquete_id"]
    }


def _puntaje(
    *,
    paquete: Paquete,
    intereses: list[str],
    preferencias: ClientePreferencia | None,
    popularidad: int,
    maxima_popularidad: int,
    tiene_salida_futura: bool,
) -> Decimal:
    texto = _texto_busqueda(paquete)
    puntaje = 0.20

    if intereses:
        coincidencias = 0
        for interes in intereses:
            terminos = ALIASES.get(interes, (interes,))
            if any(_normalizar(termino) in texto for termino in terminos):
                coincidencias += 1
        puntaje += 0.45 * (coincidencias / len(intereses))

    if preferencias and preferencias.presupuesto_max:
        if paquete.moneda == preferencias.moneda:
            presupuesto = float(preferencias.presupuesto_max)
            precio = float(paquete.precio_base)
            if presupuesto > 0:
                proporcion = precio / presupuesto
                if proporcion <= 0.75:
                    puntaje += 0.20
                elif proporcion <= 1:
                    puntaje += 0.15
                elif proporcion <= 1.25:
                    puntaje += 0.05
                else:
                    puntaje -= 0.10
        else:
            # Sin tipo de cambio local no penalizamos una moneda distinta.
            puntaje += 0.08

    if tiene_salida_futura:
        puntaje += 0.15

    if maxima_popularidad:
        puntaje += 0.15 * (popularidad / maxima_popularidad)

    return Decimal(str(round(max(0.05, min(puntaje, 0.99)), 4)))


def _candidatos():
    hoy = timezone.localdate()
    return list(
        Paquete.objects.filter(activo=True, destino__activo=True)
        .select_related("destino")
        .prefetch_related("salidas")
        .annotate(
            salidas_futuras=Count(
                "salidas",
                filter=Q(
                    salidas__fecha_salida__gte=hoy,
                    salidas__cupos_disponibles__gt=0,
                ),
                distinct=True,
            )
        )
    )


def generar_recomendaciones(
    cliente: Cliente,
    *,
    forzar: bool = False,
    limite: int = 6,
) -> list[Recomendacion]:
    """Genera y persiste una tanda de recomendaciones para el cliente."""
    preferencias = ClientePreferencia.objects.filter(cliente=cliente).first()
    modelo = _modelo_recomendador()
    actuales = list(
        Recomendacion.objects.filter(cliente=cliente, modelo=modelo)
        .select_related("paquete", "paquete__destino")
        .order_by("-generada_en")
    )

    reciente = (
        actuales
        and actuales[0].generada_en >= timezone.now() - TTL_RECOMENDACIONES
        and (
            preferencias is None
            or preferencias.actualizado_en <= actuales[0].generada_en
        )
    )
    if reciente and not forzar:
        return actuales[:limite]

    intereses = list(preferencias.intereses) if preferencias else []
    candidatos = _candidatos()
    if not candidatos:
        return []

    popularidad = _popularidad()
    maxima_popularidad = max(popularidad.values(), default=0)

    calculadas = []
    for paquete in candidatos:
        puntaje = _puntaje(
            paquete=paquete,
            intereses=intereses,
            preferencias=preferencias,
            popularidad=popularidad.get(paquete.id, 0),
            maxima_popularidad=maxima_popularidad,
            tiene_salida_futura=paquete.salidas_futuras > 0,
        )
        calculadas.append((paquete, puntaje))

    calculadas.sort(key=lambda item: (-item[1], item[0].nombre))

    with transaction.atomic():
        Recomendacion.objects.filter(
            cliente=cliente,
            modelo=modelo,
            aceptada__isnull=True,
        ).delete()
        nuevas = [
            Recomendacion(cliente=cliente, paquete=paquete, modelo=modelo, puntaje=puntaje)
            for paquete, puntaje in calculadas[:limite]
        ]
        return Recomendacion.objects.bulk_create(nuevas)


def marcar_mostradas(recomendaciones: list[Recomendacion]) -> None:
    ids = [recomendacion.id for recomendacion in recomendaciones if recomendacion.id]
    if ids:
        Recomendacion.objects.filter(id__in=ids, mostrada=False).update(mostrada=True)
        for recomendacion in recomendaciones:
            recomendacion.mostrada = True


def aceptar_recomendacion(cliente: Cliente, recomendacion_id: int) -> Recomendacion:
    try:
        recomendacion = Recomendacion.objects.select_related(
            "paquete", "paquete__destino"
        ).get(pk=recomendacion_id, cliente=cliente)
    except Recomendacion.DoesNotExist as exc:
        raise ValidationError(
            {"recomendacion": "La recomendación no existe o no pertenece al cliente."}
        ) from exc

    if recomendacion.aceptada is not True:
        recomendacion.aceptada = True
        recomendacion.mostrada = True
        recomendacion.save(update_fields=["aceptada", "mostrada"])
    return recomendacion


def resumen_admin() -> dict:
    """Indicadores de calidad del recomendador para el panel."""
    total = Recomendacion.objects.count()
    mostradas = Recomendacion.objects.filter(mostrada=True).count()
    aceptadas = Recomendacion.objects.filter(aceptada=True).count()
    tasa = round((aceptadas / mostradas) * 100, 1) if mostradas else 0.0

    por_paquete = list(
        Recomendacion.objects.values(
            "paquete_id", "paquete__nombre", "paquete__destino__nombre"
        )
        .annotate(
            total=Count("id"),
            aceptadas=Count("id", filter=Q(aceptada=True)),
            mostradas=Count("id", filter=Q(mostrada=True)),
        )
        .order_by("-aceptadas", "-total")[:10]
    )
    por_modelo = list(
        Recomendacion.objects.values("modelo__nombre", "modelo__version")
        .annotate(
            total=Count("id"),
            aceptadas=Count("id", filter=Q(aceptada=True)),
        )
        .order_by("-total")[:10]
    )
    recientes = list(
        Recomendacion.objects.select_related(
            "cliente", "paquete", "paquete__destino", "modelo"
        ).order_by("-generada_en")[:12]
    )

    return {
        "resumen": {
            "total": total,
            "mostradas": mostradas,
            "aceptadas": aceptadas,
            "tasa_aceptacion": tasa,
        },
        "por_paquete": por_paquete,
        "por_modelo": por_modelo,
        "recientes": recientes,
    }
