"""Modelos del dominio de IA: chatbot y recomendaciones (CU10 + CU11).

IMPORTANTE: re-exportar TODAS las entidades. Si se olvida una, Django la
considera eliminada y genera una migración que borra su tabla.
"""
from apps.ia.models.conversacion import Conversacion
from apps.ia.models.frase_entrenamiento import FraseEntrenamiento
from apps.ia.models.intencion import Intencion
from apps.ia.models.mensaje import Mensaje
from apps.ia.models.modelo_ia import ModeloIA
from apps.ia.models.recomendacion import Recomendacion

__all__ = [
    "Conversacion",
    "FraseEntrenamiento",
    "Intencion",
    "Mensaje",
    "ModeloIA",
    "Recomendacion",
]
