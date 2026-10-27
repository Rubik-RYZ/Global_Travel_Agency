"""Capa de esquema de CU1 · Seguridad y acceso."""
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.usuarios.models import Auditoria, Rol, Usuario


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
        fields = ["id", "email", "rol", "rol_id", "activo", "ultimo_acceso", "creado_en"]
        read_only_fields = fields


# ---------------------------------------------------------------------
# Acceso
# ---------------------------------------------------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=True)


class RegistroSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )
    nombres = serializers.CharField(max_length=120)
    apellidos = serializers.CharField(max_length=120)

    def validate_email(self, valor: str) -> str:
        return valor.strip().lower()


class RecuperarSerializer(serializers.Serializer):
    email = serializers.EmailField()


class RestablecerSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )


# ---------------------------------------------------------------------
# Panel · equipo y bitácora
# ---------------------------------------------------------------------
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
            "password", "ultimo_acceso", "creado_en",
        ]
        read_only_fields = ["id", "rol", "ultimo_acceso", "creado_en"]

    def validate_email(self, valor: str) -> str:
        return valor.strip().lower()

    def validate_rol_id(self, valor: int) -> int:
        if not Rol.objects.filter(id=valor).exists():
            raise serializers.ValidationError("El rol indicado no existe.")
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


class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.CharField(
        source="usuario.email", read_only=True, default=None
    )

    class Meta:
        model = Auditoria
        fields = [
            "id", "usuario", "usuario_email", "accion",
            "entidad", "entidad_id", "detalle", "ip", "creado_en",
        ]
        read_only_fields = fields
