"""Rutas del dominio 'ia' (CU10/CU11)."""
from django.urls import path

from apps.ia.views import ChatView

urlpatterns = [
    path("ia/chat/", ChatView.as_view(), name="ia-chat"),
]
