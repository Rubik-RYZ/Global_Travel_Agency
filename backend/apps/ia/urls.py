"""Rutas del dominio 'ia' (CU10/CU11)."""
from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.ia.views import (
    ActivarModeloRecomendadorView,
    AceptarRecomendacionView,
    ChatView,
    ConversacionViewSet,
    EntrenarRecomendadorView,
    FraseEntrenamientoViewSet,
    IntencionViewSet,
    PanelEntrenamientoView,
    PanelRecomendacionesView,
    RecomendacionesView,
    ReentrenarView,
)

router = DefaultRouter()
router.register(
    "ia/conversaciones", ConversacionViewSet, basename="ia-conversacion"
)
router.register(
    "ia/admin/intenciones", IntencionViewSet, basename="ia-admin-intencion"
)
router.register(
    "ia/admin/frases", FraseEntrenamientoViewSet, basename="ia-admin-frase"
)

urlpatterns = [
    path("ia/chat/", ChatView.as_view(), name="ia-chat"),
    path(
        "ia/admin/panel/",
        PanelEntrenamientoView.as_view(),
        name="ia-admin-panel",
    ),
    path(
        "ia/admin/reentrenar/",
        ReentrenarView.as_view(),
        name="ia-admin-reentrenar",
    ),
    path(
        "ia/recomendaciones/",
        RecomendacionesView.as_view(),
        name="ia-recomendaciones",
    ),
    path(
        "ia/recomendaciones/<int:pk>/aceptar/",
        AceptarRecomendacionView.as_view(),
        name="ia-recomendacion-aceptar",
    ),
    path(
        "ia/admin/recomendaciones/",
        PanelRecomendacionesView.as_view(),
        name="ia-admin-recomendaciones",
    ),
    path(
        "ia/admin/recomendador/entrenar/",
        EntrenarRecomendadorView.as_view(),
        name="ia-admin-recomendador-entrenar",
    ),
    path(
        "ia/admin/recomendador/modelos/<int:pk>/activar/",
        ActivarModeloRecomendadorView.as_view(),
        name="ia-admin-recomendador-activar",
    ),
    *router.urls,
]
