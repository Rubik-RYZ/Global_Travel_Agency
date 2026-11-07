"""Serializers del chat del asistente conversacional (CU10)."""
from rest_framework import serializers


class MensajeEntradaSerializer(serializers.Serializer):
    """Valida el texto enviado por el usuario."""

    mensaje = serializers.CharField(
        max_length=500,
        trim_whitespace=True,
        allow_blank=False,
    )


class RespuestaChatSerializer(serializers.Serializer):
    """Respuesta del clasificador y del asistente."""

    respuesta = serializers.CharField()
    intencion = serializers.CharField()
    confianza = serializers.FloatField()
    permitida = serializers.BooleanField()
