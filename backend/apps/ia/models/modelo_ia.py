"""Versiones de modelos de IA y sus métricas (CU10 / CU11)."""
from django.db import models


class ModeloIA(models.Model):
    """Versión entrenada de un clasificador de intenciones o recomendador."""

    TIPO_CLASIFICADOR = "clasificador_intenciones"
    TIPO_RECOMENDADOR = "recomendador"
    TIPO_CHOICES = [
        (TIPO_CLASIFICADOR, "Clasificador de intenciones"),
        (TIPO_RECOMENDADOR, "Recomendador"),
    ]

    nombre = models.TextField()
    version = models.TextField()
    tipo = models.TextField(choices=TIPO_CHOICES)
    metricas = models.JSONField(null=True, blank=True)
    activo = models.BooleanField(default=False)
    entrenado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "modelos_ia"
        verbose_name = "Modelo de IA"
        verbose_name_plural = "Modelos de IA"
        ordering = ["nombre", "version"]
        constraints = [
            models.UniqueConstraint(
                fields=["nombre", "version"],
                name="ux_modelos_ia_nombre_version",
            ),
            models.CheckConstraint(
                check=models.Q(
                    tipo__in=["clasificador_intenciones", "recomendador"]
                ),
                name="ck_modelos_ia_tipo",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} v{self.version}"
