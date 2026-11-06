"""Modelo de pasajeros por reserva (CU7)."""
from django.db import models


class ReservaPasajero(models.Model):
    """Pasajero registrado para una reserva de viaje."""

    DOCUMENTO_CHOICES = [
        ("CI", "Cédula de Identidad"),
        ("PASAPORTE", "Pasaporte"),
        ("OTRO", "Otro documento"),
    ]

    reserva = models.ForeignKey(
        "reservas.Reserva",
        on_delete=models.CASCADE,
        related_name="pasajeros",
        db_column="reserva_id",
    )
    nombres = models.TextField()
    apellidos = models.TextField()
    documento_tipo = models.CharField(max_length=20, choices=DOCUMENTO_CHOICES, null=True, blank=True)
    documento_numero = models.TextField(null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "reserva_pasajeros"
        verbose_name = "Pasajero de reserva"
        verbose_name_plural = "Pasajeros de reserva"
        indexes = [
            models.Index(fields=["reserva"], name="ix_pasajeros_reserva"),
        ]

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.reserva.codigo})"

