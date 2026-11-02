"""Capa de esquema del catálogo — destinos (CU3)."""
from rest_framework import serializers

from apps.catalogo.constants import MONEDAS
from apps.catalogo.models import Destino, ItinerarioDia


class ItinerarioDiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItinerarioDia
        fields = ["id", "numero_dia", "titulo", "descripcion", "ubicacion"]
        read_only_fields = ["id"]


class DestinoSerializer(serializers.ModelSerializer):
    etiquetas = serializers.ListField(
        child=serializers.CharField(max_length=60),
        default=list,
        required=False,
    )
    incluye = serializers.ListField(
        child=serializers.CharField(max_length=200), default=list, required=False
    )
    no_incluye = serializers.ListField(
        child=serializers.CharField(max_length=200), default=list, required=False
    )
    region_display = serializers.SerializerMethodField()
    caracter_display = serializers.SerializerMethodField()
    itinerario = ItinerarioDiaSerializer(many=True, read_only=True)

    class Meta:
        model = Destino
        fields = [
            "id", "nombre", "pais", "pais_codigo", "slug", "region",
            "region_display", "resumen", "lema", "descripcion",
            "latitud", "longitud",
            "duracion_dias", "duracion_noches", "precio_desde", "moneda",
            "mejor_epoca", "caracter", "caracter_display",
            "imagen_principal", "imagen_public_id", "incluye", "no_incluye",
            "etiquetas", "destacado", "activo", "itinerario",
        ]
        read_only_fields = ["id", "slug", "region_display", "caracter_display", "itinerario"]

    def get_region_display(self, obj):
        return obj.get_region_display() if obj.region else None

    def get_caracter_display(self, obj):
        return obj.get_caracter_display() if obj.caracter else None

    def validate_nombre(self, value):
        return value.strip()

    def validate_pais(self, value):
        return value.strip()

    def validate_pais_codigo(self, value):
        if value in (None, ""):
            return None
        valor = value.strip().upper()
        if len(valor) != 2:
            raise serializers.ValidationError("Debe ser un código ISO 3166-1 de 2 letras.")
        return valor

    def validate_moneda(self, value):
        valor = (value or "USD").strip().upper()
        if valor not in MONEDAS:
            raise serializers.ValidationError(
                f"Moneda no soportada. Opciones: {', '.join(MONEDAS)}"
            )
        return valor


class DestinoResumenSerializer(serializers.ModelSerializer):
    """Versión compacta para listados públicos (tarjetas del catálogo)."""

    region_display = serializers.SerializerMethodField()
    caracter_display = serializers.SerializerMethodField()

    class Meta:
        model = Destino
        fields = [
            "id", "nombre", "pais", "pais_codigo", "slug", "region",
            "region_display", "resumen", "latitud", "longitud",
            "duracion_dias", "duracion_noches", "precio_desde", "moneda",
            "mejor_epoca", "caracter", "caracter_display", "imagen_principal",
            "etiquetas", "destacado",
        ]

    def get_region_display(self, obj):
        return obj.get_region_display() if obj.region else None

    def get_caracter_display(self, obj):
        return obj.get_caracter_display() if obj.caracter else None
