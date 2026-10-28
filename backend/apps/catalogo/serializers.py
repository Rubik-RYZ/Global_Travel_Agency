"""Capa de esquema del catálogo turístico (CU3)."""
from rest_framework import serializers

from apps.catalogo.constants import TIPOS_PROVEEDOR
from apps.catalogo.models import Aeropuerto, Destino, Proveedor


class DestinoSerializer(serializers.ModelSerializer):
    etiquetas = serializers.ListField(
        child=serializers.CharField(max_length=60),
        default=list,
        required=False,
    )

    class Meta:
        model = Destino
        fields = [
            "id", "nombre", "pais", "descripcion",
            "latitud", "longitud", "etiquetas", "activo",
        ]
        read_only_fields = ["id"]

    def validate_nombre(self, value):
        return value.strip()

    def validate_pais(self, value):
        return value.strip()


class DestinoResumenSerializer(serializers.ModelSerializer):
    """Versión compacta para listados públicos."""
    class Meta:
        model = Destino
        fields = ["id", "nombre", "pais", "etiquetas", "latitud", "longitud"]


class AeropuertoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aeropuerto
        fields = ["codigo_iata", "nombre", "destino"]


class ProveedorSerializer(serializers.ModelSerializer):
    tipo_display = serializers.SerializerMethodField()

    class Meta:
        model = Proveedor
        fields = [
            "id", "nombre", "tipo", "tipo_display",
            "email", "telefono", "activo",
        ]
        read_only_fields = ["id", "tipo_display"]

    def get_tipo_display(self, obj):
        return dict(TIPOS_PROVEEDOR).get(obj.tipo, obj.tipo)

    def validate_tipo(self, value):
        tipos_validos = [t[0] for t in TIPOS_PROVEEDOR]
        if value not in tipos_validos:
            raise serializers.ValidationError(
                f"Tipo inválido. Opciones: {', '.join(tipos_validos)}"
            )
        return value
