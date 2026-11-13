"""Serializers del recomendador de paquetes (CU11)."""
from rest_framework import serializers

from apps.catalogo.models import Paquete
from apps.ia.models import Recomendacion
from apps.ia.serializers.entrenamiento import ModeloIASerializer
from apps.usuarios.serializers.cliente import ClientePreferenciaSerializer


class PaqueteRecomendadoSerializer(serializers.ModelSerializer):
    """Resumen suficiente para pintar una tarjeta de recomendación."""

    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)
    destino_pais = serializers.CharField(source="destino.pais", read_only=True)
    destino_imagen = serializers.CharField(
        source="destino.imagen_principal", read_only=True, default=None
    )
    destino_caracter = serializers.CharField(
        source="destino.caracter", read_only=True, default=None
    )

    class Meta:
        model = Paquete
        fields = [
            "id",
            "nombre",
            "descripcion",
            "duracion_dias",
            "precio_base",
            "moneda",
            "etiquetas",
            "destino_nombre",
            "destino_pais",
            "destino_imagen",
            "destino_caracter",
        ]


class RecomendacionSerializer(serializers.ModelSerializer):
    """Recomendación con el paquete anidado."""

    paquete = PaqueteRecomendadoSerializer(read_only=True)
    puntaje_porcentaje = serializers.SerializerMethodField()

    class Meta:
        model = Recomendacion
        fields = [
            "id",
            "puntaje",
            "puntaje_porcentaje",
            "mostrada",
            "aceptada",
            "generada_en",
            "paquete",
        ]

    def get_puntaje_porcentaje(self, obj: Recomendacion) -> int:
        return round(float(obj.puntaje) * 100)


class RespuestaRecomendacionesSerializer(serializers.Serializer):
    """Respuesta completa para la vista 'Pensado para ti'."""

    modelo = ModeloIASerializer(allow_null=True)
    preferencias = ClientePreferenciaSerializer(allow_null=True)
    recomendaciones = RecomendacionSerializer(many=True)
    generada_en = serializers.DateTimeField(allow_null=True)
    usa_historial = serializers.BooleanField()


class RecomendacionAdminSerializer(serializers.ModelSerializer):
    """Fila reciente del panel de calidad de recomendaciones."""

    cliente = serializers.SerializerMethodField()
    paquete = serializers.CharField(source="paquete.nombre", read_only=True)
    destino = serializers.CharField(
        source="paquete.destino.nombre", read_only=True
    )
    modelo_version = serializers.CharField(
        source="modelo.version", read_only=True, default=None
    )

    class Meta:
        model = Recomendacion
        fields = [
            "id",
            "cliente",
            "paquete",
            "destino",
            "modelo_version",
            "puntaje",
            "mostrada",
            "aceptada",
            "generada_en",
        ]

    def get_cliente(self, obj: Recomendacion) -> str:
        return obj.cliente.nombre_completo
