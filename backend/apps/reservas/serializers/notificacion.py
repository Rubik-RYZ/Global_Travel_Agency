"""Serializadores para el centro de notificaciones (CU8)."""
from rest_framework import serializers

from apps.reservas.models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    reserva_codigo = serializers.CharField(source="reserva.codigo", read_only=True)

    class Meta:
        model = Notificacion
        fields = [
            "id",
            "tipo",
            "estado",
            "reserva",
            "reserva_codigo",
            "creado_en",
        ]

