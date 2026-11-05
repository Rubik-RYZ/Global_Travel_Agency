"""Capa de esquema — clientes y preferencias (CU2)."""
from rest_framework import serializers

from apps.usuarios.constants import INTERESES_SUGERIDOS
from apps.usuarios.models import Cliente, ClientePreferencia


def _normalizar_intereses(valor: list[str]) -> list[str]:
    """Limpia, baja a minúsculas y elimina duplicados conservando el orden."""
    limpios: list[str] = []
    for interes in valor or []:
        etiqueta = (interes or "").strip().lower()
        if etiqueta and etiqueta not in limpios:
            limpios.append(etiqueta)
    return limpios


class ClientePreferenciaSerializer(serializers.ModelSerializer):
    """Preferencias del viajero (alimentan al recomendador — CU11)."""

    class Meta:
        model = ClientePreferencia
        fields = ["presupuesto_max", "moneda", "intereses", "actualizado_en"]
        read_only_fields = ["actualizado_en"]

    def validate_intereses(self, valor: list[str]) -> list[str]:
        limpios = _normalizar_intereses(valor)
        desconocidos = [e for e in limpios if e not in INTERESES_SUGERIDOS]
        if desconocidos:
            raise serializers.ValidationError(
                "Interés(es) no reconocido(s): " + ", ".join(desconocidos) + "."
            )
        return limpios


class ClienteSerializer(serializers.ModelSerializer):
    """Viajero: lectura y escritura desde el panel.

    `usuario` es de solo lectura (el alta desde el panel no crea cuentas);
    las preferencias se anidan para la ficha del viajero.
    """

    usuario_email = serializers.CharField(
        source="usuario.email", read_only=True, default=None
    )
    # Retrato del viajero: vive en su cuenta (`usuarios.foto_url`), no en la
    # ficha. Se expone en solo lectura para que el panel lo muestre sin
    # duplicar el dato (la consulta ya trae la cuenta con `select_related`).
    foto_url = serializers.CharField(
        source="usuario.foto_url", read_only=True, default=None
    )
    nombre_completo = serializers.CharField(read_only=True)
    preferencias = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            "id", "usuario", "usuario_email", "foto_url", "nombres", "apellidos",
            "nombre_completo", "documento_tipo", "documento_numero",
            "telefono", "fecha_nacimiento", "pais_origen",
            "pasaporte_url", "pasaporte_public_id",
            "carnet_url", "carnet_public_id",
            "preferencias", "creado_en",
        ]
        read_only_fields = [
            "id", "usuario", "usuario_email", "foto_url", "nombre_completo",
            "preferencias", "creado_en",
        ]

    def get_preferencias(self, obj) -> dict | None:
        try:
            return ClientePreferenciaSerializer(obj.clientepreferencia).data
        except ClientePreferencia.DoesNotExist:
            return None


class PerfilClienteSerializer(serializers.ModelSerializer):
    """Ficha que el propio viajero consulta y edita («Mi viaje»)."""

    email = serializers.CharField(source="usuario.email", read_only=True, default=None)
    nombre_completo = serializers.CharField(read_only=True)

    class Meta:
        model = Cliente
        fields = [
            "id", "email", "nombres", "apellidos", "nombre_completo",
            "documento_tipo", "documento_numero", "telefono",
            "fecha_nacimiento", "pais_origen",
            "pasaporte_url", "pasaporte_public_id",
            "carnet_url", "carnet_public_id", "creado_en",
        ]
        read_only_fields = ["id", "email", "nombre_completo", "creado_en"]
