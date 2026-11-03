"""Capa de esquema del catálogo — vuelos (CU4)."""
from rest_framework import serializers

from apps.catalogo.constants import MONEDAS
from apps.catalogo.models import Vuelo


class VueloSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    origen_nombre = serializers.CharField(source="origen.nombre", read_only=True)
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)
    cupos_disponibles = serializers.IntegerField(required=False)

    class Meta:
        model = Vuelo
        fields = [
            "id", "proveedor", "proveedor_nombre", "numero_vuelo",
            "origen", "origen_nombre", "destino", "destino_nombre",
            "salida", "llegada", "precio", "moneda",
            "cupos_totales", "cupos_disponibles", "referencia_externa",
        ]
        read_only_fields = [
            "id", "proveedor_nombre", "origen_nombre", "destino_nombre",
        ]

    def validate_numero_vuelo(self, value):
        valor = (value or "").strip().upper()
        if not valor:
            raise serializers.ValidationError("El número de vuelo es obligatorio.")
        return valor

    def validate_moneda(self, value):
        valor = (value or "USD").strip().upper()
        if valor not in MONEDAS:
            raise serializers.ValidationError(
                f"Moneda no soportada. Opciones: {', '.join(MONEDAS)}"
            )
        return valor

    def validate_proveedor(self, value):
        if value.tipo != "aerolinea":
            raise serializers.ValidationError(
                "El proveedor del vuelo debe ser una aerolínea."
            )
        return value

    def validate(self, attrs):
        origen = attrs.get("origen", getattr(self.instance, "origen", None))
        destino = attrs.get("destino", getattr(self.instance, "destino", None))
        salida = attrs.get("salida", getattr(self.instance, "salida", None))
        llegada = attrs.get("llegada", getattr(self.instance, "llegada", None))
        totales = attrs.get(
            "cupos_totales", getattr(self.instance, "cupos_totales", None)
        )
        disponibles = attrs.get(
            "cupos_disponibles", getattr(self.instance, "cupos_disponibles", None)
        )

        if origen and destino and origen.pk == destino.pk:
            raise serializers.ValidationError(
                {"destino": "El destino debe ser distinto del origen."}
            )
        if salida and llegada and llegada <= salida:
            raise serializers.ValidationError(
                {"llegada": "La llegada debe ser posterior a la salida."}
            )
        if totales is not None and totales < 0:
            raise serializers.ValidationError(
                {"cupos_totales": "Los cupos totales no pueden ser negativos."}
            )
        if disponibles is not None and disponibles < 0:
            raise serializers.ValidationError(
                {"cupos_disponibles": "Los cupos disponibles no pueden ser negativos."}
            )
        if (
            totales is not None
            and disponibles is not None
            and disponibles > totales
        ):
            raise serializers.ValidationError(
                {"cupos_disponibles": "No puede superar los cupos totales."}
            )
        if "precio" in attrs and attrs["precio"] is not None and attrs["precio"] < 0:
            raise serializers.ValidationError(
                {"precio": "El precio no puede ser negativo."}
            )
        return attrs