"""Historial persistido del asistente conversacional (CU10)."""
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.ia.models import Conversacion
from apps.ia.serializers import ConversacionSerializer


class ConversacionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Conversaciones del usuario autenticado, con sus mensajes."""

    permission_classes = [IsAuthenticated]
    serializer_class = ConversacionSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Conversacion.objects.filter(usuario=self.request.user)
            .prefetch_related("mensajes__intencion")
            .order_by("-ultima_actividad")
        )
