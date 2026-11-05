"""Modelo de itinerario personalizado por reserva (CU8)."""
from django.db import models


class Itinerario(models.Model):
    """Itinerario cronológico asignado a una reserva de viaje."""

    GENERADO_SISTEMA = "sistema"
    GENERADO_IA = "ia"
    GENERADO_PERSONAL = "personal"

    GENERADO_CHOICES = [
        (GENERADO_SISTEMA, "Generado automáticamente por el sistema"),
        (GENERADO_IA, "Compuesto por asistente IA"),
        (GENERADO_PERSONAL, "Editado por agente de viajes"),
    ]

    reserva = models.OneToOneField(
        "reservas.Reserva",
        on_delete=models.CASCADE,
        related_name="itinerario",
        db_column="reserva_id",
    )
    generado_por = models.CharField(
        max_length=20, choices=GENERADO_CHOICES, default=GENERADO_SISTEMA
    )
    pdf_url = models.TextField(blank=True, null=True, help_text="URL del itinerario exportado en PDF")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "itinerarios"
        verbose_name = "Itinerario de reserva"
        verbose_name_plural = "Itinerarios de reserva"

    def __str__(self):
        return f"Itinerario de {self.reserva.codigo} ({self.generado_por})"

