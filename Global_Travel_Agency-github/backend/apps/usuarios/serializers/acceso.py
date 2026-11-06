"""Capa de esquema — acceso: login, registro y recuperación (CU1)."""
from rest_framework import serializers


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
