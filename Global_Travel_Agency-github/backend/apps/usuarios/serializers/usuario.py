"""Capa de esquema — usuarios y equipo (CU1)."""
from rest_framework import serializers

from apps.usuarios.constants import ROLES_EQUIPO
from apps.usuarios.models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre"]


class UsuarioSerializer(serializers.ModelSerializer):
    """Representación pública del usuario (nunca expone el hash)."""

    rol = serializers.CharField(source="rol.nombre", read_only=True)
    rol_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id", "email", "rol", "rol_id", "activo",
            "foto_url", "foto_public_id", "ultimo_acceso", "creado_en",
        ]
        read_only_fields = fields


class UsuarioEquipoSerializer(serializers.ModelSerializer):
    """Serializar y dar de alta usuarios internos desde el panel."""

    rol = serializers.CharField(source="rol.nombre", read_only=True)
    rol_id = serializers.IntegerField(required=False)
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = Usuario
        fields = [
            "id", "email", "rol", "rol_id", "activo",
            "foto_url", "foto_public_id",
            "password", "ultimo_acceso", "creado_en",
        ]
        read_only_fields = ["id", "rol", "ultimo_acceso", "creado_en"]

    def validate_email(self, valor: str) -> str:
        return valor.strip().lower()

    def validate_rol_id(self, valor: int) -> int:
        if not Rol.objects.filter(id=valor).exists():
            raise serializers.ValidationError("El rol indicado no existe.")
        if valor not in ROLES_EQUIPO:
            raise serializers.ValidationError(
                "En «Equipo y accesos» solo se asignan roles internos "
                "(administrador o agente)."
            )
        return valor

    def validate(self, datos: dict) -> dict:
        if self.instance is None and datos.get("rol_id") is None:
            raise serializers.ValidationError(
                {"rol_id": "El rol es obligatorio para crear un usuario."}
            )
        if self.instance is None and not datos.get("password"):
            raise serializers.ValidationError(
                {"password": "La contraseña es obligatoria para crear un usuario."}
            )
        return datos


class FotoUsuarioSerializer(serializers.Serializer):
    """Retrato propio del usuario autenticado (área «Mi viaje» y panel)."""

    foto_url = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=500
    )
    foto_public_id = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=500
    )
