"""Serializadores para el dominio de paquetes turísticos y salidas programadas (CU6)."""
from rest_framework import serializers

from apps.catalogo.models import Paquete, PaqueteSalida
from apps.catalogo.serializers.destino import DestinoResumenSerializer, ItinerarioDiaSerializer
from apps.catalogo.serializers.hotel import HotelDetailSerializer, HotelListSerializer
from apps.catalogo.serializers.vuelo import VueloListSerializer
from apps.catalogo.services.paquetes import (
    actualizar_paquete,
    actualizar_salida,
    crear_paquete,
    crear_salida,
)


class PaqueteSalidaSerializer(serializers.ModelSerializer):
    paquete_nombre = serializers.CharField(source="paquete.nombre", read_only=True)
    vuelo_ida_detalle = VueloListSerializer(source="vuelo_ida", read_only=True)
    vuelo_vuelta_detalle = VueloListSerializer(source="vuelo_vuelta", read_only=True)

    class Meta:
        model = PaqueteSalida
        fields = [
            "id",
            "paquete",
            "paquete_nombre",
            "fecha_salida",
            "vuelo_ida",
            "vuelo_ida_detalle",
            "vuelo_vuelta",
            "vuelo_vuelta_detalle",
            "cupos_totales",
            "cupos_disponibles",
        ]


class PaqueteSalidaWriteSerializer(serializers.ModelSerializer):
    paquete_id = serializers.IntegerField(write_only=True)
    vuelo_ida_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    vuelo_vuelta_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = PaqueteSalida
        fields = [
            "id",
            "paquete_id",
            "fecha_salida",
            "vuelo_ida_id",
            "vuelo_vuelta_id",
            "cupos_totales",
            "cupos_disponibles",
        ]
        extra_kwargs = {
            "cupos_disponibles": {"required": False},
        }

    def create(self, validated_data):
        return crear_salida(
            paquete_id=validated_data.pop("paquete_id"),
            fecha_salida=validated_data.pop("fecha_salida"),
            vuelo_ida_id=validated_data.get("vuelo_ida_id"),
            vuelo_vuelta_id=validated_data.get("vuelo_vuelta_id"),
            cupos_totales=validated_data.pop("cupos_totales"),
            cupos_disponibles=validated_data.get("cupos_disponibles"),
        )

    def update(self, instance, validated_data):
        return actualizar_salida(instance.id, **validated_data)


class PaqueteListSerializer(serializers.ModelSerializer):
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)
    destino_pais = serializers.CharField(source="destino.pais", read_only=True)
    destino_imagen_principal = serializers.CharField(source="destino.imagen_principal", read_only=True)
    hotel_nombre = serializers.CharField(source="hotel.nombre", read_only=True)
    hotel_estrellas = serializers.IntegerField(source="hotel.estrellas", read_only=True)
    salidas_proximas_count = serializers.IntegerField(source="salidas.count", read_only=True)

    class Meta:
        model = Paquete
        fields = [
            "id",
            "destino",
            "destino_nombre",
            "destino_pais",
            "destino_imagen_principal",
            "hotel",
            "hotel_nombre",
            "hotel_estrellas",
            "nombre",
            "descripcion",
            "duracion_dias",
            "precio_base",
            "moneda",
            "etiquetas",
            "activo",
            "salidas_proximas_count",
        ]


class PaqueteDetailSerializer(serializers.ModelSerializer):
    destino = DestinoResumenSerializer(read_only=True)
    hotel = HotelDetailSerializer(read_only=True)
    salidas = PaqueteSalidaSerializer(many=True, read_only=True)
    itinerario = ItinerarioDiaSerializer(source="destino.itinerario", many=True, read_only=True)

    class Meta:
        model = Paquete
        fields = [
            "id",
            "destino",
            "hotel",
            "nombre",
            "descripcion",
            "duracion_dias",
            "precio_base",
            "moneda",
            "etiquetas",
            "activo",
            "salidas",
            "itinerario",
        ]


class PaqueteWriteSerializer(serializers.ModelSerializer):
    destino_id = serializers.IntegerField(write_only=True)
    hotel_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Paquete
        fields = [
            "id",
            "destino_id",
            "hotel_id",
            "nombre",
            "descripcion",
            "duracion_dias",
            "precio_base",
            "moneda",
            "etiquetas",
            "activo",
        ]
        extra_kwargs = {
            "descripcion": {"required": False, "allow_blank": True, "allow_null": True},
            "etiquetas": {"required": False},
            "activo": {"required": False},
        }

    def create(self, validated_data):
        return crear_paquete(
            destino_id=validated_data.pop("destino_id"),
            hotel_id=validated_data.get("hotel_id"),
            nombre=validated_data.pop("nombre"),
            descripcion=validated_data.get("descripcion"),
            duracion_dias=validated_data.pop("duracion_dias"),
            precio_base=validated_data.pop("precio_base"),
            moneda=validated_data.get("moneda", "USD"),
            etiquetas=validated_data.get("etiquetas", []),
            activo=validated_data.get("activo", True),
        )

    def update(self, instance, validated_data):
        return actualizar_paquete(instance.id, **validated_data)

