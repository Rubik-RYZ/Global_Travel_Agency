"""Serializers del historial de conversaciones del asistente (CU10)."""
from rest_framework import serializers

from apps.ia.models import Conversacion, Mensaje


class MensajeHistorialSerializer(serializers.ModelSerializer):
    """Turno guardado en la base de datos."""

    intencion_nombre = serializers.CharField(
        source="intencion.nombre", read_only=True, default=None
    )

    class Meta:
        model = Mensaje
        fields = [
            "id",
            "emisor",
            "texto",
            "intencion_nombre",
            "confianza",
            "creado_en",
        ]


class ConversacionSerializer(serializers.ModelSerializer):
    """Hilo completo con sus mensajes, visible sólo para su dueño."""

    mensajes = MensajeHistorialSerializer(many=True, read_only=True)
    titulo = serializers.SerializerMethodField()

    class Meta:
        model = Conversacion
        fields = [
            "id",
            "titulo",
            "intencion_activa",
            "estado_dialogo",
            "cerrada",
            "iniciada_en",
            "ultima_actividad",
            "mensajes",
        ]

    def get_titulo(self, obj: Conversacion) -> str:
        primero = next(
            (
                mensaje.texto
                for mensaje in obj.mensajes.all()
                if mensaje.emisor == Mensaje.EMISOR_USUARIO
            ),
            "",
        )
        if len(primero) <= 60:
            return primero or "Nueva conversación"
        return f"{primero[:60]}…"
