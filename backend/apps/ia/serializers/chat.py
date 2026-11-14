from rest_framework import serializers

class MensajeEntradaSerializer(serializers.Serializer):
    mensaje = serializers.CharField(
        max_length=500,
        trim_whitespace=True,
        allow_blank=False,
    )
    conversacion_id = serializers.UUIDField(required=False, allow_null=True)

class RespuestaChatSerializer(serializers.Serializer):
    respuesta = serializers.CharField()
    intencion = serializers.CharField()
    confianza = serializers.FloatField()
    permitida = serializers.BooleanField()
    conversacion_id = serializers.UUIDField(allow_null=True)
