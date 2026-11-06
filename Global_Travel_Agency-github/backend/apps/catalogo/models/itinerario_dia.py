"""Día del itinerario de un destino (CU3).

Es contenido descriptivo del catálogo (el diario de ruta que ve el visitante),
distinto de los itinerarios de una reserva (CU8).
"""
from django.db import models

from apps.catalogo.models.destino import Destino


class ItinerarioDia(models.Model):
    """Un día del itinerario de un destino (diario de ruta día a día)."""

    destino = models.ForeignKey(
        Destino,
        on_delete=models.CASCADE,
        related_name="itinerario",
        db_column="destino_id",
    )
    numero_dia = models.PositiveSmallIntegerField()
    titulo = models.TextField()
    descripcion = models.TextField(null=True, blank=True)
    ubicacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "itinerario_dias"
        verbose_name = "Día de itinerario"
        verbose_name_plural = "Días de itinerario"
        ordering = ["numero_dia"]
        constraints = [
            models.UniqueConstraint(
                fields=["destino", "numero_dia"],
                name="ux_itinerario_destino_dia",
            ),
            models.CheckConstraint(
                check=models.Q(numero_dia__gt=0),
                name="ck_itinerario_numero_dia",
            ),
        ]

    def __str__(self):
        return f"Día {self.numero_dia} · {self.titulo}"
