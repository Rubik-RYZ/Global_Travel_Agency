"""Hotel de un destino, ofrecido por un proveedor (CU5)."""
from django.db import models

from apps.catalogo.models.destino import Destino
from apps.catalogo.models.proveedor import Proveedor


class Hotel(models.Model):
    """Hospedaje concreto en un destino: categoría, ubicación y ficha."""

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name="hoteles",
        db_column="proveedor_id",
    )
    destino = models.ForeignKey(
        Destino,
        on_delete=models.PROTECT,
        related_name="hoteles",
        db_column="destino_id",
    )
    nombre = models.TextField()
    # Categoría en estrellas (1–5); puede quedar sin clasificar.
    estrellas = models.PositiveSmallIntegerField(null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    latitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    descripcion = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "hoteles"
        verbose_name = "Hotel"
        verbose_name_plural = "Hoteles"
        ordering = ["nombre"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(estrellas__gte=1, estrellas__lte=5)
                | models.Q(estrellas__isnull=True),
                name="ck_hoteles_estrellas",
            ),
            models.CheckConstraint(
                check=models.Q(latitud__gte=-90, latitud__lte=90)
                | models.Q(latitud__isnull=True),
                name="ck_hoteles_latitud",
            ),
            models.CheckConstraint(
                check=models.Q(longitud__gte=-180, longitud__lte=180)
                | models.Q(longitud__isnull=True),
                name="ck_hoteles_longitud",
            ),
        ]
        indexes = [
            models.Index(fields=["destino"], name="ix_hoteles_destino"),
        ]

    def __str__(self):
        return f"{self.nombre} · {self.destino_id}"