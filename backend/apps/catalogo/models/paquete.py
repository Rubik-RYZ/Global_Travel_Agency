"""Paquete turístico vendible (CU6).

Un paquete es la oferta comercial (destino, hotel, duración y precio base por
persona); cada salida concreta se registra en `PaqueteSalida`.
"""
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models

from apps.catalogo.constants import MONEDAS
from apps.catalogo.models.destino import Destino
from apps.catalogo.models.hotel import Hotel


class Paquete(models.Model):
    """Oferta de viaje: destino, hospedaje, duración y precio base."""

    destino = models.ForeignKey(
        Destino,
        on_delete=models.PROTECT,
        related_name="paquetes",
        db_column="destino_id",
    )
    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.PROTECT,
        related_name="paquetes",
        null=True,
        blank=True,
        db_column="hotel_id",
    )
    nombre = models.TextField()
    descripcion = models.TextField(null=True, blank=True)
    duracion_dias = models.PositiveSmallIntegerField()
    # Precio por persona, antes de extras y salidas concretas.
    precio_base = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, default="USD")
    etiquetas = ArrayField(models.TextField(), default=list, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "paquetes"
        verbose_name = "Paquete"
        verbose_name_plural = "Paquetes"
        ordering = ["nombre"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(duracion_dias__gt=0),
                name="ck_paquetes_duracion_dias",
            ),
            models.CheckConstraint(
                check=models.Q(precio_base__gte=0),
                name="ck_paquetes_precio_base",
            ),
            models.CheckConstraint(
                check=models.Q(moneda__in=MONEDAS),
                name="ck_paquetes_moneda",
            ),
        ]
        indexes = [
            models.Index(fields=["destino"], name="ix_paquetes_destino"),
            GinIndex(fields=["etiquetas"], name="ix_paquetes_etiquetas"),
        ]

    def __str__(self):
        return f"{self.nombre} · {self.destino_id}"