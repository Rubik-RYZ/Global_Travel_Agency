"""Servicios del panel de entrenamiento del asistente (CU10)."""
from __future__ import annotations

from django.db.models import Count

from apps.ia.models import (
    Conversacion,
    FraseEntrenamiento,
    Intencion,
    Mensaje,
    ModeloIA,
)
from apps.ia.services.clasificador import recargar_clasificador


def listar_intenciones():
    """Intenciones con su cantidad de frases, ordenadas por nombre."""
    return Intencion.objects.annotate(total_frases=Count("frases")).order_by("nombre")


def reentrenar_clasificador():
    """Reentrena y devuelve el clasificador activo."""
    return recargar_clasificador()


def resumen_entrenamiento() -> dict:
    """Métricas y catálogo actual del asistente."""
    modelo_activo = (
        ModeloIA.objects.filter(
            tipo=ModeloIA.TIPO_CLASIFICADOR, activo=True
        )
        .order_by("-entrenado_en")
        .first()
    )
    return {
        "intenciones": listar_intenciones(),
        "frases_total": FraseEntrenamiento.objects.count(),
        "conversaciones_total": Conversacion.objects.count(),
        "mensajes_total": Mensaje.objects.count(),
        "modelo_activo": modelo_activo,
        "modelos": list(
            ModeloIA.objects.filter(tipo=ModeloIA.TIPO_CLASIFICADOR)
            .order_by("-entrenado_en")[:8]
        ),
    }
