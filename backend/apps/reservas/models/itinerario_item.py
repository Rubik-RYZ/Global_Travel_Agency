"""Actividades e hitos día por día del itinerario (CU8)."""
from django.db import models
from django.db.models import UniqueConstraint


class ItinerarioItem(models.Model):
    """Actividad o escala horaria dentro de un día del itinerario."""

    itinerario = models.ForeignKey(
        "reservas.Itinerario",
        on_delete=models.CASCADE,
        related_name="items",
        db_column="itinerario_id",
    )
    dia = models.PositiveSmallIntegerField(help_text="Número de día dentro del viaje (1, 2, ...)")
    orden = models.PositiveSmallIntegerField(default=1, help_text="Secuencia dentro del día")
    hora = models.TimeField(null=True, blank=True, help_text="Hora estimada de inicio")
    titulo = models.TextField()
    descripcion = models.TextField(null=True, blank=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        db_table = "itinerario_items"
        verbose_name = "Actividad del itinerario"
        verbose_name_plural = "Actividades del itinerario"
        ordering = ["dia", "orden"]
        constraints = [
            UniqueConstraint(
                fields=["itinerario", "dia", "orden"],
                name="itinerario_items_dia_orden_uniq",
            ),
        ]

    def __str__(self):
        hora_str = f" a las {self.hora.strftime('%H:%M')}" if self.hora else ""
        return f"Día {self.dia}{hora_str}: {self.titulo}"

