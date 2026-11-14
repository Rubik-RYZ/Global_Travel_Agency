import uuid

from django.db import models

class Conversacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.PROTECT,
        related_name="conversaciones",
        db_column="usuario_id",
    )
    estado_dialogo = models.JSONField(default=dict)
    intencion_activa = models.TextField(null=True, blank=True)
    cerrada = models.BooleanField(default=False)
    iniciada_en = models.DateTimeField(auto_now_add=True)
    ultima_actividad = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversaciones"
        verbose_name = "Conversación"
        verbose_name_plural = "Conversaciones"
        ordering = ["-ultima_actividad"]
        indexes = [
            models.Index(
                fields=["usuario", "-ultima_actividad"],
                name="ix_conversaciones_usuario",
            ),
        ]

    def __str__(self):
        return f"Conversación {self.id} de {self.usuario_id}"
