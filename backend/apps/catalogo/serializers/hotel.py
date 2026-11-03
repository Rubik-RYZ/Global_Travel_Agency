"""Capa de esquema del catálogo — hoteles (CU5)."""
from rest_framework import serializers

from apps.catalogo.models import Hotel


class HotelSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)

    class Meta:
        model = Hotel
        fields = [
            "id", "proveedor", "proveedor_nombre", "destino", "destino_nombre",
            "nombre", "estrellas", "direccion", "latitud", "longitud",
            "descripcion", "activo",
        ]
        read_only_fields = ["id", "proveedor_nombre", "destino_nombre"]

    def validate_nombre(self, value):
        valor = (value or "").strip()
        if not valor:
            raise serializers.ValidationError("El nombre del hotel es obligatorio.")
        return valor

    def validate_proveedor(self, value):
        if value.tipo != "hotel":
            raise serializers.ValidationError(
                "El proveedor del hotel debe ser de tipo hotel."
            )
        return value

    def validate_estrellas(self, value):
        if value is not None and not 1 <= value <= 5:
            raise serializers.ValidationError(
                "La categoría debe estar entre 1 y 5 estrellas."
            )
        return value

    def validate_latitud(self, value):
        if value is not None and not -90 <= value <= 90:
            raise serializers.ValidationError("La latitud debe estar entre -90 y 90.")
        return value

    def validate_longitud(self, value):
        if value is not None and not -180 <= value <= 180:
            raise serializers.ValidationError(
                "La longitud debe estar entre -180 y 180."
            )
        return value