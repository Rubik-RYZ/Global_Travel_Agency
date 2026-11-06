"""Capa de esquema — bitácora de auditoría (CU1)."""
from rest_framework import serializers

from apps.usuarios.models import Auditoria


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
