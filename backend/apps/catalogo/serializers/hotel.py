"""Serializadores para el dominio de hoteles y habitaciones (CU5)."""
from rest_framework import serializers

from apps.catalogo.models import Habitacion, Hotel
from apps.catalogo.serializers.destino import DestinoResumenSerializer
from apps.catalogo.serializers.proveedor import ProveedorSerializer
from apps.catalogo.services.hoteles import (
    actualizar_habitacion,
    actualizar_hotel,
    crear_habitacion,
    crear_hotel,
)


class HabitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habitacion
        fields = [
            "id",
            "hotel",
            "tipo",
            "capacidad",
            "precio_noche",
            "moneda",
        ]


class HabitacionWriteSerializer(serializers.ModelSerializer):
    hotel_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Habitacion
        fields = [
            "id",
            "hotel_id",
            "tipo",
            "capacidad",
            "precio_noche",
            "moneda",
        ]

    def create(self, validated_data):
        return crear_habitacion(
            hotel_id=validated_data.pop("hotel_id"),
            tipo=validated_data.pop("tipo"),
            capacidad=validated_data.pop("capacidad"),
            precio_noche=validated_data.pop("precio_noche"),
            moneda=validated_data.get("moneda", "USD"),
        )

    def update(self, instance, validated_data):
        return actualizar_habitacion(instance.id, **validated_data)


class HotelListSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)
    habitaciones_count = serializers.IntegerField(source="habitaciones.count", read_only=True)

    class Meta:
        model = Hotel
        fields = [
            "id",
            "proveedor",
            "proveedor_nombre",
            "destino",
            "destino_nombre",
            "nombre",
            "estrellas",
            "direccion",
            "latitud",
            "longitud",
            "descripcion",
            "activo",
            "habitaciones_count",
        ]


class HotelDetailSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    destino = DestinoResumenSerializer(read_only=True)
    habitaciones = HabitacionSerializer(many=True, read_only=True)

    class Meta:
        model = Hotel
        fields = [
            "id",
            "proveedor",
            "destino",
            "nombre",
            "estrellas",
            "direccion",
            "latitud",
            "longitud",
            "descripcion",
            "activo",
            "habitaciones",
        ]


class HotelWriteSerializer(serializers.ModelSerializer):
    proveedor_id = serializers.IntegerField(write_only=True)
    destino_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Hotel
        fields = [
            "id",
            "proveedor_id",
            "destino_id",
            "nombre",
            "estrellas",
            "direccion",
            "latitud",
            "longitud",
            "descripcion",
            "activo",
        ]
        extra_kwargs = {
            "estrellas": {"required": False, "allow_null": True},
            "direccion": {"required": False, "allow_blank": True, "allow_null": True},
            "latitud": {"required": False, "allow_null": True},
            "longitud": {"required": False, "allow_null": True},
            "descripcion": {"required": False, "allow_blank": True, "allow_null": True},
            "activo": {"required": False},
        }

    def create(self, validated_data):
        return crear_hotel(
            proveedor_id=validated_data.pop("proveedor_id"),
            destino_id=validated_data.pop("destino_id"),
            nombre=validated_data.pop("nombre"),
            estrellas=validated_data.get("estrellas"),
            direccion=validated_data.get("direccion"),
            latitud=validated_data.get("latitud"),
            longitud=validated_data.get("longitud"),
            descripcion=validated_data.get("descripcion"),
            activo=validated_data.get("activo", True),
        )

    def update(self, instance, validated_data):
        return actualizar_hotel(instance.id, **validated_data)

