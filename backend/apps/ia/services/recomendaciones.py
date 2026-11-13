"""Recomendador híbrido de paquetes turísticos (CU11).

Combina señales de contenido (intereses, presupuesto y disponibilidad) con el
historial del cliente (reservas no canceladas y recomendaciones aceptadas).
Cada tanda de sugerencias queda agrupada en un ``lote`` para conservar las
métricas históricas sin duplicar la vista del viajero.
"""
from __future__ import annotations

import unicodedata
import uuid
from collections import Counter
from dataclasses import dataclass, field
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

NOMBRE_MODELO = "recomendador-hibrido"
ALGORITMO = "hibrido-contenido-historial"
TTL_RECOMENDACIONES = timedelta(hours=6)

# Los pesos suman 1.00; el puntaje final se acota a [0.05, 0.99].
PESOS_DEFECTO = {
    "base": 0.05,
    "intereses": 0.35,
    "presupuesto": 0.15,
    "salidas": 0.10,
    "popularidad": 0.10,
    "historial": 0.25,
}
PESOS_HISTORIAL = {"destinos": 0.40, "etiquetas": 0.60}
NEUTRO = 0.5

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


@dataclass
class PerfilHistorial:
    """Señales del cliente construidas a partir de su actividad pasada."""

    destinos: Counter = field(default_factory=Counter)
    etiquetas: Counter = field(default_factory=Counter)
    paquetes_reservados: set[int] = field(default_factory=set)
    total_reservas: int = 0
    total_aceptadas: int = 0

    @property
    def total_eventos(self) -> int:
        return self.total_reservas + self.total_aceptadas


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


def _acumular_paquete(perfil: PerfilHistorial, paquete: Paquete) -> None:
    """Suma destino y etiquetas de un paquete al perfil del cliente."""
    perfil.destinos[paquete.destino_id] += 1
    etiquetas = list(paquete.etiquetas or []) + list(paquete.destino.etiquetas or [])
    for etiqueta in etiquetas:
        limpia = _normalizar(etiqueta)
        if limpia:
            perfil.etiquetas[limpia] += 1


def _perfil_historial(cliente: Cliente) -> PerfilHistorial:
    """Historial del cliente: reservas no canceladas y sugerencias aceptadas."""
    perfil = PerfilHistorial()

    reservas = (
        Reserva.objects.filter(cliente=cliente)
        .exclude(estado=Reserva.ESTADO_CANCELADA)
        .select_related("salida__paquete__destino")
    )
    for reserva in reservas:
        paquete = reserva.salida.paquete
        _acumular_paquete(perfil, paquete)
        perfil.paquetes_reservados.add(paquete.id)
        perfil.total_reservas += 1

    aceptadas = Recomendacion.objects.filter(
        cliente=cliente, aceptada=True
    ).select_related("paquete__destino")
    for recomendacion in aceptadas:
        _acumular_paquete(perfil, recomendacion.paquete)
        perfil.total_aceptadas += 1

    return perfil


def tiene_historial(cliente: Cliente) -> bool:
    """Indica si el cliente tiene señales históricas para personalizar."""
    if (
        Reserva.objects.filter(cliente=cliente)
        .exclude(estado=Reserva.ESTADO_CANCELADA)
        .exists()
    ):
        return True
    return Recomendacion.objects.filter(cliente=cliente, aceptada=True).exists()


def _historial_score(paquete: Paquete, perfil: PerfilHistorial) -> float:
    """Afinidad del paquete con el historial del cliente, en [0, 1]."""
    if not perfil.total_eventos:
        return NEUTRO

    max_destinos = max(perfil.destinos.values(), default=0)
    destino_score = (
        perfil.destinos.get(paquete.destino_id, 0) / max_destinos
        if max_destinos
        else 0.0
    )

    etiquetas = [
        _normalizar(etiqueta)
        for etiqueta in (
            list(paquete.etiquetas or []) + list(paquete.destino.etiquetas or [])
        )
        if _normalizar(etiqueta)
    ]
    max_etiquetas = max(perfil.etiquetas.values(), default=0)
    if etiquetas and max_etiquetas:
        coincidencias = sum(perfil.etiquetas.get(etiqueta, 0) for etiqueta in etiquetas)
        etiquetas_score = coincidencias / (max_etiquetas * len(etiquetas))
    else:
        etiquetas_score = 0.0

    return max(
        0.0,
        min(
            1.0,
            PESOS_HISTORIAL["destinos"] * destino_score
            + PESOS_HISTORIAL["etiquetas"] * etiquetas_score,
        ),
    )


def obtener_modelo_activo() -> ModeloIA | None:
    """Versión activa del recomendador, si existe."""
    return (
        ModeloIA.objects.filter(tipo=ModeloIA.TIPO_RECOMENDADOR, activo=True)
        .order_by("-entrenado_en")
        .first()
    )


def _pesos_modelo(modelo: ModeloIA | None) -> dict[str, float]:
    metricas = (modelo.metricas or {}) if modelo else {}
    pesos = metricas.get("pesos") or {}
    return {
        clave: float(pesos.get(clave, valor))
        for clave, valor in PESOS_DEFECTO.items()
    }


def _modelo_recomendador() -> ModeloIA:
    """Modelo activo; si no hay ninguno, entrena la primera versión."""
    modelo = obtener_modelo_activo()
    if modelo is None:
        modelo = entrenar_recomendador()
    return modelo


def _metricas_entrenamiento() -> dict:
    """Fotografía del histórico que acompaña a cada versión."""
    total = Recomendacion.objects.count()
    mostradas = Recomendacion.objects.filter(mostrada=True).count()
    aceptadas = Recomendacion.objects.filter(aceptada=True).count()
    tasa = round((aceptadas / mostradas) * 100, 1) if mostradas else 0.0

    reservas = Reserva.objects.exclude(estado=Reserva.ESTADO_CANCELADA)
    clientes = set(reservas.values_list("cliente_id", flat=True))
    clientes |= set(
        Recomendacion.objects.filter(aceptada=True).values_list("cliente_id", flat=True)
    )
    paquetes_activos = Paquete.objects.filter(activo=True, destino__activo=True)

    return {
        "paquetes_activos": paquetes_activos.count(),
        "destinos_activos": paquetes_activos.values("destino_id").distinct().count(),
        "reservas_historicas": reservas.count(),
        "clientes_con_historial": len(clientes),
        "aceptaciones": aceptadas,
        "total_recomendaciones": total,
        "mostradas": mostradas,
        "tasa_aceptacion": tasa,
    }


def entrenar_recomendador() -> ModeloIA:
    """Crea una nueva versión activa con los pesos y métricas actuales."""
    version = timezone.now().strftime("%Y%m%d%H%M%S%f")
    metricas = _metricas_entrenamiento()

    with transaction.atomic():
        ModeloIA.objects.filter(tipo=ModeloIA.TIPO_RECOMENDADOR).update(activo=False)
        return ModeloIA.objects.create(
            nombre=NOMBRE_MODELO,
            version=version,
            tipo=ModeloIA.TIPO_RECOMENDADOR,
            metricas={
                **metricas,
                "pesos": PESOS_DEFECTO,
                "pesos_historial": PESOS_HISTORIAL,
                "algoritmo": ALGORITMO,
            },
            activo=True,
        )


def activar_modelo(modelo: ModeloIA) -> ModeloIA:
    """Activa una versión del recomendador y desactiva las demás."""
    with transaction.atomic():
        actual = ModeloIA.objects.select_for_update().get(
            pk=modelo.pk, tipo=ModeloIA.TIPO_RECOMENDADOR
        )
        ModeloIA.objects.filter(tipo=ModeloIA.TIPO_RECOMENDADOR).exclude(
            pk=actual.pk
        ).update(activo=False)
        if not actual.activo:
            actual.activo = True
            actual.save(update_fields=["activo"])
        return actual


def listar_modelos_recomendador(limite: int = 20) -> list[ModeloIA]:
    """Versiones del recomendador, de la más reciente a la más antigua."""
    return list(
        ModeloIA.objects.filter(tipo=ModeloIA.TIPO_RECOMENDADOR)
        .order_by("-entrenado_en")[:limite]
    )


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
    historial: float,
    pesos: dict[str, float],
) -> Decimal:
    texto = _texto_busqueda(paquete)
    puntaje = pesos["base"]

    if intereses:
        coincidencias = 0
        for interes in intereses:
            terminos = ALIASES.get(interes, (interes,))
            if any(_normalizar(termino) in texto for termino in terminos):
                coincidencias += 1
        interes_score = coincidencias / len(intereses)
    else:
        interes_score = NEUTRO
    puntaje += pesos["intereses"] * interes_score

    if preferencias and preferencias.presupuesto_max:
        if paquete.moneda == preferencias.moneda:
            presupuesto = float(preferencias.presupuesto_max)
            precio = float(paquete.precio_base)
            if presupuesto > 0:
                proporcion = precio / presupuesto
                if proporcion <= 0.75:
                    presupuesto_score = 1.0
                elif proporcion <= 1:
                    presupuesto_score = 0.85
                elif proporcion <= 1.25:
                    presupuesto_score = 0.45
                else:
                    presupuesto_score = 0.0
            else:
                presupuesto_score = NEUTRO
        else:
            # Sin tipo de cambio local no penalizamos una moneda distinta.
            presupuesto_score = 0.6
    else:
        presupuesto_score = NEUTRO
    puntaje += pesos["presupuesto"] * presupuesto_score

    puntaje += pesos["salidas"] * (1.0 if tiene_salida_futura else 0.0)

    if maxima_popularidad:
        puntaje += pesos["popularidad"] * (popularidad / maxima_popularidad)

    puntaje += pesos["historial"] * historial

    return Decimal(str(round(max(0.05, min(puntaje, 0.99)), 4)))


def _candidatos(excluir_ids: set[int] | None = None):
    hoy = timezone.localdate()
    qs = (
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
    if excluir_ids:
        qs = qs.exclude(id__in=excluir_ids)
    return list(qs)


def generar_recomendaciones(
    cliente: Cliente,
    *,
    forzar: bool = False,
    limite: int = 6,
) -> list[Recomendacion]:
    """Genera y persiste una tanda de recomendaciones para el cliente."""
    preferencias = ClientePreferencia.objects.filter(cliente=cliente).first()
    modelo = _modelo_recomendador()
    pesos = _pesos_modelo(modelo)

    ultima = (
        Recomendacion.objects.filter(cliente=cliente)
        .select_related("paquete", "paquete__destino", "modelo")
        .order_by("-generada_en")
        .first()
    )
    reciente = (
        ultima is not None
        and ultima.modelo_id == modelo.id
        and ultima.generada_en >= timezone.now() - TTL_RECOMENDACIONES
        and (
            preferencias is None
            or preferencias.actualizado_en <= ultima.generada_en
        )
    )
    if reciente and not forzar:
        return list(
            Recomendacion.objects.filter(cliente=cliente, lote=ultima.lote)
            .select_related("paquete", "paquete__destino", "modelo")
            .order_by("-puntaje", "paquete__nombre")[:limite]
        )

    perfil = _perfil_historial(cliente)
    intereses = list(preferencias.intereses) if preferencias else []
    candidatos = _candidatos(perfil.paquetes_reservados)
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
            historial=_historial_score(paquete, perfil),
            pesos=pesos,
        )
        calculadas.append((paquete, puntaje))

    calculadas.sort(key=lambda item: (-item[1], item[0].nombre))

    lote = uuid.uuid4()
    with transaction.atomic():
        nuevas = [
            Recomendacion(
                cliente=cliente,
                paquete=paquete,
                modelo=modelo,
                puntaje=puntaje,
                lote=lote,
            )
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
    historial = _metricas_entrenamiento()

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
            "total": historial["total_recomendaciones"],
            "mostradas": historial["mostradas"],
            "aceptadas": historial["aceptaciones"],
            "tasa_aceptacion": historial["tasa_aceptacion"],
        },
        "por_paquete": por_paquete,
        "por_modelo": por_modelo,
        "recientes": recientes,
        "modelo_activo": obtener_modelo_activo(),
        "modelos": listar_modelos_recomendador(),
        "historial": historial,
    }
