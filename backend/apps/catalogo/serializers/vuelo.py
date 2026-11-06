"""Serializadores para el dominio de vuelos (CU4)."""
from rest_framework import serializers

from apps.catalogo.models import Aeropuerto, Proveedor, Vuelo
from apps.catalogo.serializers.aeropuerto import AeropuertoSerializer
from apps.catalogo.serializers.proveedor import ProveedorSerializer
from apps.catalogo.services.vuelos import crear_vuelo, actualizar_vuelo


class VueloListSerializer(serializers.ModelSerializer):
    """Representación enriquecida para listados y vistas administrativas."""

    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    origen_codigo = serializers.CharField(source="origen.codigo_iata", read_only=True)
    origen_nombre = serializers.CharField(source="origen.nombre", read_only=True)
    destino_codigo = serializers.CharField(source="destino.codigo_iata", read_only=True)
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)

    class Meta:
        model = Vuelo
        fields = [
            "id",
            "proveedor",
            "proveedor_nombre",
            "numero_vuelo",
            "origen",
            "origen_codigo",
            "origen_nombre",
            "destino",
            "destino_codigo",
            "destino_nombre",
            "salida",
            "llegada",
            "precio",
            "moneda",
            "cupos_totales",
            "cupos_disponibles",
            "referencia_externa",
        ]


class VueloDetailSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    origen = AeropuertoSerializer(read_only=True)
    destino = AeropuertoSerializer(read_only=True)

    class Meta:
        model = Vuelo
        fields = [
            "id",
            "proveedor",
            "numero_vuelo",
            "origen",
            "destino",
            "salida",
            "llegada",
            "precio",
            "moneda",
            "cupos_totales",
            "cupos_disponibles",
            "referencia_externa",
        ]


class VueloWriteSerializer(serializers.ModelSerializer):
    proveedor_id = serializers.IntegerField(write_only=True)
    origen_codigo = serializers.CharField(max_length=3, write_only=True)
    destino_codigo = serializers.CharField(max_length=3, write_only=True)

    class Meta:
        model = Vuelo
        fields = [
            "id",
            "proveedor_id",
            "numero_vuelo",
            "origen_codigo",
            "destino_codigo",
            "salida",
            "llegada",
            "precio",
            "moneda",
            "cupos_totales",
            "cupos_disponibles",
            "referencia_externa",
        ]
        extra_kwargs = {
            "cupos_disponibles": {"required": False},
            "referencia_externa": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def create(self, validated_data):
        return crear_vuelo(
            proveedor_id=validated_data.pop("proveedor_id"),
            numero_vuelo=validated_data.pop("numero_vuelo"),
            origen_codigo=validated_data.pop("origen_codigo"),
            destino_codigo=validated_data.pop("destino_codigo"),
            salida=validated_data.pop("salida"),
            llegada=validated_data.pop("llegada"),
            precio=validated_data.pop("precio"),
            moneda=validated_data.get("moneda", "USD"),
            cupos_totales=validated_data.pop("cupos_totales"),
            cupos_disponibles=validated_data.get("cupos_disponibles"),
            referencia_externa=validated_data.get("referencia_externa"),
        )

    def update(self, instance, validated_data):
        return actualizar_vuelo(instance.id, **validated_data)

