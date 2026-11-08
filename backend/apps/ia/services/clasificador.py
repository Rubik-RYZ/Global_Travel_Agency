"""Clasificador de intenciones del asistente conversacional (CU10).

Entrena un pipeline TF-IDF + LogisticRegression con las frases cargadas en la
tabla ``frases_entrenamiento``. El modelo se cachea en memoria y se reentrena
cuando el comando de carga lo solicita.
"""
from __future__ import annotations

from dataclasses import dataclass
from threading import Lock

from django.utils import timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from apps.ia.models import FraseEntrenamiento, ModeloIA

INTENCION_FALLBACK = "fallback"
CONFIANZA_MINIMA = 0.25
NOMBRE_MODELO = "clasificador-intenciones"


@dataclass(frozen=True)
class Prediccion:
    """Resultado de clasificar un mensaje."""

    intencion: str
    confianza: float


class ClasificadorIntenciones:
    """Clasificador entrenado a partir del catálogo de frases."""

    def __init__(self, pipeline: Pipeline | None = None, modelo_id: int | None = None):
        self._pipeline = pipeline
        self.modelo_id = modelo_id

    @property
    def entrenado(self) -> bool:
        return self._pipeline is not None

    def predecir(self, texto: str) -> Prediccion:
        limpio = (texto or "").strip()
        if not limpio or self._pipeline is None:
            return Prediccion(INTENCION_FALLBACK, 0.0)

        probabilidades = self._pipeline.predict_proba([limpio])[0]
        indice = int(probabilidades.argmax())
        confianza = round(float(probabilidades[indice]), 3)

        if confianza < CONFIANZA_MINIMA:
            return Prediccion(INTENCION_FALLBACK, confianza)

        intencion = str(self._pipeline.classes_[indice])
        return Prediccion(intencion, confianza)


def _registrar_modelo(
    pipeline: Pipeline,
    textos: list[str],
    categorias: list[str],
) -> ModeloIA:
    """Guarda la versión entrenada y sus métricas en ``modelos_ia``."""
    ModeloIA.objects.filter(tipo=ModeloIA.TIPO_CLASIFICADOR).update(activo=False)
    version = timezone.now().strftime("%Y%m%d%H%M%S%f")
    return ModeloIA.objects.create(
        nombre=NOMBRE_MODELO,
        version=version,
        tipo=ModeloIA.TIPO_CLASIFICADOR,
        metricas={
            "frases": len(textos),
            "intenciones": len(set(categorias)),
            "precision_entrenamiento": round(
                float(pipeline.score(textos, categorias)), 4
            ),
            "confianza_minima": CONFIANZA_MINIMA,
            "algoritmo": "tfidf+logistic_regression",
        },
        activo=True,
    )


def _construir_pipeline() -> tuple[Pipeline, int] | None:
    filas = list(
        FraseEntrenamiento.objects.filter(intencion__activa=True).values_list(
            "texto", "intencion__nombre"
        )
    )
    if not filas:
        return None

    etiquetas = {nombre for _, nombre in filas}
    if len(etiquetas) < 2:
        return None

    textos = [texto for texto, _ in filas]
    categorias = [nombre for _, nombre in filas]

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                ),
            ),
            (
                "modelo",
                LogisticRegression(
                    max_iter=3000,
                    C=20,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )
    pipeline.fit(textos, categorias)
    modelo = _registrar_modelo(pipeline, textos, categorias)
    return pipeline, modelo.id


def _nuevo_clasificador() -> ClasificadorIntenciones:
    resultado = _construir_pipeline()
    if resultado is None:
        return ClasificadorIntenciones()
    pipeline, modelo_id = resultado
    return ClasificadorIntenciones(pipeline, modelo_id=modelo_id)


_lock = Lock()
_clasificador = ClasificadorIntenciones()


def recargar_clasificador() -> ClasificadorIntenciones:
    """Reentrena el clasificador con el catálogo actual de frases."""
    global _clasificador
    with _lock:
        _clasificador = _nuevo_clasificador()
    return _clasificador


def obtener_clasificador() -> ClasificadorIntenciones:
    """Devuelve el clasificador cacheado, entrenándolo en el primer uso."""
    global _clasificador
    if not _clasificador.entrenado:
        with _lock:
            if not _clasificador.entrenado:
                _clasificador = _nuevo_clasificador()
    return _clasificador
