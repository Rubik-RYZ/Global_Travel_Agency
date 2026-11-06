"""Bitácora de auditoría (CU1)."""
from django.db import models


class Auditoria(models.Model):
    """Bitácora de seguridad: logins, cambios y acciones relevantes."""

    usuario = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="usuario_id",
    )
    accion = models.TextField()
    entidad = models.TextField(null=True, blank=True)
    entidad_id = models.TextField(null=True, blank=True)
    detalle = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria"
        verbose_name = "Registro de auditoría"
        verbose_name_plural = "Bitácora de auditoría"
        indexes = [
            models.Index(fields=["usuario", "-creado_en"], name="ix_auditoria_usuario"),
        ]

    def __str__(self):
        return f"{self.creado_en:%Y-%m-%d %H:%M} · {self.accion}"
