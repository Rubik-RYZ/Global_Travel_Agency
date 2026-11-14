from rest_framework import permissions, viewsets

from apps.reservas.serializers.notificacion import NotificacionSerializer
from apps.reservas.services.notificaciones import listar_notificaciones

class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return listar_notificaciones(usuario_id=self.request.user.id)
