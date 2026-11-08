"""Capa de presentación del dominio 'ia' (CU10 + CU11)."""
from apps.ia.views.chat import ChatView
from apps.ia.views.conversacion import ConversacionViewSet
from apps.ia.views.entrenamiento import (
    FraseEntrenamientoViewSet,
    IntencionViewSet,
    PanelEntrenamientoView,
    ReentrenarView,
)
from apps.ia.views.recomendaciones import (
    AceptarRecomendacionView,
    PanelRecomendacionesView,
    RecomendacionesView,
)

__all__ = [
    "AceptarRecomendacionView",
    "ChatView",
    "ConversacionViewSet",
    "FraseEntrenamientoViewSet",
    "IntencionViewSet",
    "PanelEntrenamientoView",
    "PanelRecomendacionesView",
    "RecomendacionesView",
    "ReentrenarView",
]
