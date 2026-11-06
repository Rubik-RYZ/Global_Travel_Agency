"""Capa de esquema del catálogo — proveedores (CU3)."""
from rest_framework import serializers

from apps.catalogo.constants import TIPOS_PROVEEDOR
from apps.catalogo.models import Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    tipo_display = serializers.SerializerMethodField()

    class Meta:
        model = Proveedor
        fields = [
            "id", "nombre", "tipo", "tipo_display",
            "pais", "ciudad", "contacto",
            "email", "telefono", "notas",
            "logo_url", "logo_public_id", "activo",
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
