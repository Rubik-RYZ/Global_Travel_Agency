"""Capa de esquema del catálogo — paquetes y salidas (CU6)."""
from rest_framework import serializers

from apps.catalogo.constants import MONEDAS
from apps.catalogo.models import Paquete, PaqueteSalida


class PaqueteSalidaSerializer(serializers.ModelSerializer):
    vuelo_ida_numero = serializers.CharField(
        source="vuelo_ida.numero_vuelo", read_only=True
    )
    vuelo_vuelta_numero = serializers.CharField(
        source="vuelo_vuelta.numero_vuelo", read_only=True
    )
    paquete_nombre = serializers.CharField(source="paquete.nombre", read_only=True)
    cupos_disponibles = serializers.IntegerField(required=False)

    class Meta:
        model = PaqueteSalida
        fields = [
            "id", "paquete", "paquete_nombre", "fecha_salida",
            "vuelo_ida", "vuelo_ida_numero", "vuelo_vuelta",
            "vuelo_vuelta_numero", "cupos_totales", "cupos_disponibles",
        ]
        read_only_fields = [
            "id", "paquete_nombre", "vuelo_ida_numero", "vuelo_vuelta_numero",
        ]
        # La unicidad (paquete, fecha) se valida en el servicio, que devuelve
        # el error sobre `fecha_salida` y no como error general.
        validators = []

    def validate(self, attrs):
        totales = attrs.get(
            "cupos_totales", getattr(self.instance, "cupos_totales", None)
        )
        disponibles = attrs.get(
            "cupos_disponibles", getattr(self.instance, "cupos_disponibles", None)
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
        return attrs


class PaqueteSerializer(serializers.ModelSerializer):
    etiquetas = serializers.ListField(
        child=serializers.CharField(max_length=60), default=list, required=False
    )

    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True)
    hotel_nombre = serializers.SerializerMethodField()
    salidas = PaqueteSalidaSerializer(many=True, read_only=True)

    def get_hotel_nombre(self, obj):
        return obj.hotel.nombre if obj.hotel_id else None

    class Meta:
        model = Paquete
        fields = [
            "id", "destino", "destino_nombre", "hotel", "hotel_nombre",
            "nombre", "descripcion", "duracion_dias", "precio_base",
            "moneda", "etiquetas", "activo", "salidas",
        ]
        read_only_fields = ["id", "destino_nombre", "hotel_nombre", "salidas"]

    def validate_nombre(self, value):
        valor = (value or "").strip()
        if not valor:
            raise serializers.ValidationError("El nombre del paquete es obligatorio.")
        return valor

    def validate_moneda(self, value):
        valor = (value or "USD").strip().upper()
        if valor not in MONEDAS:
            raise serializers.ValidationError(
                f"Moneda no soportada. Opciones: {', '.join(MONEDAS)}"
            )
        return valor

    def validate_duracion_dias(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "La duración debe ser mayor que cero."
            )
        return value

    def validate_precio_base(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El precio no puede ser negativo.")
        return value