from apps.ia.views.chat import ChatView
from apps.ia.views.conversacion import ConversacionViewSet
from apps.ia.views.entrenamiento import (
    FraseEntrenamientoViewSet,
    IntencionViewSet,
    PanelEntrenamientoView,
    ReentrenarView,
)
from apps.ia.views.recomendaciones import (
    ActivarModeloRecomendadorView,
    AceptarRecomendacionView,
    EntrenarRecomendadorView,
    PanelRecomendacionesView,
    RecomendacionesView,
)

__all__ = [
    "ActivarModeloRecomendadorView",
    "AceptarRecomendacionView",
    "ChatView",
    "ConversacionViewSet",
    "EntrenarRecomendadorView",
    "FraseEntrenamientoViewSet",
    "IntencionViewSet",
    "PanelEntrenamientoView",
    "PanelRecomendacionesView",
    "RecomendacionesView",
    "ReentrenarView",
]
