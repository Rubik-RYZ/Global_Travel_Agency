"""Modelo de paquetes turísticos (CU6)."""
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, Q


class Paquete(models.Model):
    """Oferta paquetizada que agrupa destino, alojamiento y salidas programadas."""

    MONEDA_CHOICES = [
        ("BOB", "Bolivianos"),
        ("USD", "Dólares estadounidenses"),
        ("EUR", "Euros"),
    ]

    destino = models.ForeignKey(
        "catalogo.Destino",
        on_delete=models.PROTECT,
        related_name="paquetes",
        db_column="destino_id",
    )
    hotel = models.ForeignKey(
        "catalogo.Hotel",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="paquetes",
        db_column="hotel_id",
    )
    nombre = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    duracion_dias = models.PositiveSmallIntegerField(help_text="Duración total del paquete en días")
    precio_base = models.DecimalField(max_digits=12, decimal_places=2, help_text="Precio base por persona")
    moneda = models.CharField(max_length=3, choices=MONEDA_CHOICES, default="USD")
    etiquetas = ArrayField(models.TextField(), default=list, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "paquetes"
        verbose_name = "Paquete turístico"
        verbose_name_plural = "Paquetes turísticos"
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=["destino"], name="ix_paquetes_destino"),
            GinIndex(fields=["etiquetas"], name="ix_paquetes_etiquetas"),
        ]
        constraints = [
            CheckConstraint(
                check=Q(duracion_dias__gt=0),
                name="paquetes_duracion_positiva",
            ),
            CheckConstraint(
                check=Q(precio_base__gte=0),
                name="paquetes_precio_base_no_negativo",
            ),
        ]

    def clean(self):
        super().clean()
        if self.duracion_dias is not None and self.duracion_dias <= 0:
            raise ValidationError({"duracion_dias": "La duración debe ser de al menos 1 día."})
        if self.precio_base is not None and self.precio_base < 0:
            raise ValidationError({"precio_base": "El precio base no puede ser negativo."})

    def __str__(self):
        return f"{self.nombre} ({self.duracion_dias} días) · {self.destino.nombre}"

