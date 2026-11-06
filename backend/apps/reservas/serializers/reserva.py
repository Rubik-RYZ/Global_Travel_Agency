"""Serializadores del dominio de reservas (CU7)."""
from rest_framework import serializers

from apps.catalogo.serializers.paquete import PaqueteSalidaSerializer
from apps.reservas.models import Reserva, ReservaPasajero
from apps.reservas.services.reservas import crear_reserva


class ReservaPasajeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservaPasajero
        fields = [
            "id",
            "nombres",
            "apellidos",
            "documento_tipo",
            "documento_numero",
            "fecha_nacimiento",
        ]


class ReservaListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True)
    paquete_nombre = serializers.CharField(source="salida.paquete.nombre", read_only=True)
    destino_nombre = serializers.CharField(source="salida.paquete.destino.nombre", read_only=True)
    fecha_salida = serializers.DateField(source="salida.fecha_salida", read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id",
            "codigo",
            "cliente",
            "cliente_nombre",
            "salida",
            "paquete_nombre",
            "destino_nombre",
            "fecha_salida",
            "num_personas",
            "estado",
            "total",
            "moneda",
            "canal",
            "creada_en",
        ]


class ReservaDetailSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True)
    cliente_documento = serializers.CharField(source="cliente.documento_numero", read_only=True)
    cliente_telefono = serializers.CharField(source="cliente.telefono", read_only=True)
    salida = PaqueteSalidaSerializer(read_only=True)
    pasajeros = ReservaPasajeroSerializer(many=True, read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id",
            "codigo",
            "cliente",
            "cliente_nombre",
            "cliente_documento",
            "cliente_telefono",
            "salida",
            "num_personas",
            "estado",
            "total",
            "moneda",
            "canal",
            "conversacion_id",
            "creada_en",
            "actualizada_en",
            "pasajeros",
        ]


class PasajeroInputSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150)
    documento_tipo = serializers.ChoiceField(choices=["CI", "PASAPORTE", "OTRO"], required=False, allow_null=True)
    documento_numero = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)


class ReservaCreateSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(required=False)
    salida_id = serializers.IntegerField()
    num_personas = serializers.IntegerField(min_value=1)
    canal = serializers.ChoiceField(choices=["web", "agente", "personal"], default="web")
    conversacion_id = serializers.UUIDField(required=False, allow_null=True)
    pasajeros = PasajeroInputSerializer(many=True)

    def create(self, validated_data):
        user = self.context["request"].user
        cliente_id = validated_data.get("cliente_id")

        # Si es un cliente regular, se asocia automáticamente a su registro de Cliente
        if not cliente_id:
            if hasattr(user, "cliente") and user.cliente:
                cliente_id = user.cliente.id
            else:
                raise serializers.ValidationError({"cliente": "Usuario autenticado no tiene un perfil de viajero asociado."})

        return crear_reserva(
            cliente_id=cliente_id,
            salida_id=validated_data["salida_id"],
            num_personas=validated_data["num_personas"],
            pasajeros_datos=validated_data["pasajeros"],
            canal=validated_data.get("canal", "web"),
            conversacion_id=validated_data.get("conversacion_id"),
        )

