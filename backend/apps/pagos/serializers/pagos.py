"""Serializadores del dominio de pagos (CU9)."""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.pagos.models import Pago
from apps.reservas.serializers.reserva import PasajeroInputSerializer

METODOS_VENTANILLA = ["efectivo", "tarjeta", "qr", "transferencia"]
METODOS_CLIENTE = ["tarjeta", "qr"]


def _como_drf_validation(exc: DjangoValidationError):
    """Convierte los errores de dominio (Django) al formato de DRF."""
    detalle = getattr(exc, "message_dict", None) or exc.messages
    raise serializers.ValidationError(detalle)


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = [
            "id",
            "reserva",
            "monto",
            "moneda",
            "tipo_cambio_a_bob",
            "monto_bob",
            "metodo",
            "estado",
            "creado_en",
        ]


class PagoAdminSerializer(serializers.ModelSerializer):
    """Pago con contexto de reserva y cliente para el libro de pagos (CU9)."""

    reserva_codigo = serializers.CharField(source="reserva.codigo", read_only=True)
    reserva_estado = serializers.CharField(source="reserva.estado", read_only=True)
    cliente_id = serializers.IntegerField(source="reserva.cliente_id", read_only=True)
    cliente_nombre = serializers.CharField(
        source="reserva.cliente.nombre_completo", read_only=True
    )
    cliente_documento = serializers.CharField(
        source="reserva.cliente.documento_numero", read_only=True
    )
    paquete_nombre = serializers.CharField(
        source="reserva.salida.paquete.nombre", read_only=True
    )
    destino_nombre = serializers.CharField(
        source="reserva.salida.paquete.destino.nombre", read_only=True
    )
    fecha_salida = serializers.DateField(
        source="reserva.salida.fecha_salida", read_only=True
    )

    class Meta:
        model = Pago
        fields = [
            "id",
            "reserva",
            "reserva_codigo",
            "reserva_estado",
            "cliente_id",
            "cliente_nombre",
            "cliente_documento",
            "paquete_nombre",
            "destino_nombre",
            "fecha_salida",
            "monto",
            "moneda",
            "tipo_cambio_a_bob",
            "monto_bob",
            "metodo",
            "estado",
            "creado_en",
        ]


class ClienteNuevoSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150)
    documento_tipo = serializers.ChoiceField(
        choices=["CI", "PASAPORTE", "OTRO"], required=False, allow_null=True
    )
    documento_numero = serializers.CharField(
        max_length=50, required=False, allow_null=True, allow_blank=True
    )
    telefono = serializers.CharField(
        max_length=50, required=False, allow_null=True, allow_blank=True
    )
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)

    def to_internal_value(self, data):
        # Un formulario puede enviar "" cuando la fecha es opcional.
        if hasattr(data, "copy") and data.get("fecha_nacimiento") == "":
            data = data.copy()
            data["fecha_nacimiento"] = None
        return super().to_internal_value(data)


class VentaVentanillaSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(required=False)
    cliente_nuevo = ClienteNuevoSerializer(required=False)
    salida_id = serializers.IntegerField()
    num_personas = serializers.IntegerField(min_value=1)
    pasajeros = PasajeroInputSerializer(many=True)
    metodo = serializers.ChoiceField(choices=METODOS_VENTANILLA, default="efectivo")

    def validate(self, attrs):
        if not attrs.get("cliente_id") and not attrs.get("cliente_nuevo"):
            raise serializers.ValidationError(
                {"cliente": "Indica un cliente existente o registra uno nuevo."}
            )
        if attrs.get("cliente_id") and attrs.get("cliente_nuevo"):
            raise serializers.ValidationError(
                {"cliente": "Elige un cliente existente o uno nuevo, no ambos."}
            )
        return attrs

    def create(self, validated_data):
        from apps.pagos.services.ventanilla import registrar_venta_ventanilla

        try:
            return registrar_venta_ventanilla(
                cliente_id=validated_data.get("cliente_id"),
                cliente_nuevo=validated_data.get("cliente_nuevo"),
                salida_id=validated_data["salida_id"],
                num_personas=validated_data["num_personas"],
                pasajeros_datos=validated_data["pasajeros"],
                metodo=validated_data["metodo"],
                registrado_por=self.context["request"].user,
            )
        except DjangoValidationError as exc:
            _como_drf_validation(exc)


class PagoClienteSerializer(serializers.Serializer):
    reserva_id = serializers.IntegerField()
    metodo = serializers.ChoiceField(choices=METODOS_CLIENTE, default="tarjeta")

    def create(self, validated_data):
        from apps.pagos.services.pagos import registrar_pago_cliente

        try:
            return registrar_pago_cliente(
                usuario=self.context["request"].user,
                reserva_id=validated_data["reserva_id"],
                metodo=validated_data["metodo"],
            )
        except DjangoValidationError as exc:
            _como_drf_validation(exc)
