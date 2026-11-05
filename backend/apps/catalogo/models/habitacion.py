"""Modelo de habitaciones por hotel (CU5)."""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, Q


class Habitacion(models.Model):
    """Tipología de habitación ofertada en un hotel."""

    MONEDA_CHOICES = [
        ("BOB", "Bolivianos"),
        ("USD", "Dólares estadounidenses"),
        ("EUR", "Euros"),
    ]

    hotel = models.ForeignKey(
        "catalogo.Hotel",
        on_delete=models.CASCADE,
        related_name="habitaciones",
        db_column="hotel_id",
    )
    tipo = models.TextField(help_text="Ejemplo: Simple, Doble Estándar, Suite Superior, Familiar")
    capacidad = models.PositiveSmallIntegerField(help_text="Número máximo de huéspedes")
    precio_noche = models.DecimalField(max_digits=12, decimal_places=2, help_text="Precio por noche")
    moneda = models.CharField(max_length=3, choices=MONEDA_CHOICES, default="USD")

    class Meta:
        db_table = "habitaciones"
        verbose_name = "Habitación"
        verbose_name_plural = "Habitaciones"
        ordering = ["hotel", "precio_noche"]
        constraints = [
            CheckConstraint(
                check=Q(capacidad__gt=0),
                name="habitaciones_capacidad_positiva",
            ),
            CheckConstraint(
                check=Q(precio_noche__gte=0),
                name="habitaciones_precio_no_negativo",
            ),
        ]

    def clean(self):
        super().clean()
        if self.capacidad is not None and self.capacidad <= 0:
            raise ValidationError({"capacidad": "La capacidad debe ser de al menos 1 huésped."})
        if self.precio_noche is not None and self.precio_noche < 0:
            raise ValidationError({"precio_noche": "El precio por noche no puede ser negativo."})

    def __str__(self):
        return f"{self.tipo} ({self.capacidad} pers.) - {self.hotel.nombre}"

