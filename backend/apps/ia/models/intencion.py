"""Intención reconocida por el agente conversacional (CU10)."""
from django.db import models


class Intencion(models.Model):
    """Catálogo de intenciones que puede clasificar el agente."""

    id = models.SmallAutoField(primary_key=True)
    nombre = models.TextField(unique=True)
    descripcion = models.TextField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "intenciones"
        verbose_name = "Intención"
        verbose_name_plural = "Intenciones"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
