"""Modelo de hoteles asociados a destinos (CU5)."""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, Q


class Hotel(models.Model):
    """Establecimiento de hospedaje contratado para los paquetes turísticos."""

    proveedor = models.ForeignKey(
        "catalogo.Proveedor",
        on_delete=models.PROTECT,
        related_name="hoteles",
        db_column="proveedor_id",
        limit_choices_to={"tipo": "hotel"},
    )
    destino = models.ForeignKey(
        "catalogo.Destino",
        on_delete=models.PROTECT,
        related_name="hoteles",
        db_column="destino_id",
    )
    nombre = models.TextField()
    estrellas = models.PositiveSmallIntegerField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "hoteles"
        verbose_name = "Hotel"
        verbose_name_plural = "Hoteles"
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=["destino"], name="ix_hoteles_destino"),
        ]
        constraints = [
            CheckConstraint(
                check=Q(estrellas__gte=1, estrellas__lte=5) | Q(estrellas__isnull=True),
                name="hoteles_estrellas_entre_1_y_5",
            ),
            CheckConstraint(
                check=Q(latitud__gte=-90, latitud__lte=90) | Q(latitud__isnull=True),
                name="hoteles_latitud_valida",
            ),
            CheckConstraint(
                check=Q(longitud__gte=-180, longitud__lte=180) | Q(longitud__isnull=True),
                name="hoteles_longitud_valida",
            ),
        ]

    def clean(self):
        super().clean()
        if self.estrellas is not None and not (1 <= self.estrellas <= 5):
            raise ValidationError({"estrellas": "La categoría debe estar entre 1 y 5 estrellas."})
        if self.latitud is not None and not (-90 <= self.latitud <= 90):
            raise ValidationError({"latitud": "La latitud debe estar entre -90 y 90 grados."})
        if self.longitud is not None and not (-180 <= self.longitud <= 180):
            raise ValidationError({"longitud": "La longitud debe estar entre -180 y 180 grados."})

    def __str__(self):
        estrellas_str = f" ({'★' * self.estrellas})" if self.estrellas else ""
        return f"{self.nombre}{estrellas_str} · {self.destino.nombre}"

