"""Serializadores del dominio de itinerarios (CU8)."""
from rest_framework import serializers

from apps.reservas.models import Itinerario, ItinerarioItem
from apps.reservas.services.itinerarios import actualizar_items_itinerario


class ItinerarioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItinerarioItem
        fields = [
            "id",
            "dia",
            "orden",
            "hora",
            "titulo",
            "descripcion",
            "latitud",
            "longitud",
        ]


class ItinerarioDetailSerializer(serializers.ModelSerializer):
    items = ItinerarioItemSerializer(many=True, read_only=True)
    reserva_codigo = serializers.CharField(source="reserva.codigo", read_only=True)

    class Meta:
        model = Itinerario
        fields = [
            "id",
            "reserva",
            "reserva_codigo",
            "generado_por",
            "pdf_url",
            "creado_en",
            "items",
        ]


class ItinerarioItemInputSerializer(serializers.Serializer):
    dia = serializers.IntegerField(min_value=1)
    orden = serializers.IntegerField(default=1)
    hora = serializers.TimeField(required=False, allow_null=True)
    titulo = serializers.CharField(max_length=255)
    descripcion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    latitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)


class ItinerarioUpdateSerializer(serializers.Serializer):
    items = ItinerarioItemInputSerializer(many=True)

    def update(self, instance, validated_data):
        return actualizar_items_itinerario(instance.id, validated_data["items"])

