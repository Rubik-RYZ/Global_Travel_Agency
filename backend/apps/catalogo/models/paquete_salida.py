"""Salida concreta de un paquete: fecha, vuelos y cupos (CU6)."""
from django.db import models

from apps.catalogo.models.paquete import Paquete
from apps.catalogo.models.vuelo import Vuelo


class PaqueteSalida(models.Model):
    """Fecha de salida de un paquete, con sus vuelos y cupos disponibles."""

    paquete = models.ForeignKey(
        Paquete,
        on_delete=models.CASCADE,
        related_name="salidas",
        db_column="paquete_id",
    )
    fecha_salida = models.DateField()
    vuelo_ida = models.ForeignKey(
        Vuelo,
        on_delete=models.PROTECT,
        related_name="salidas_ida",
        null=True,
        blank=True,
        db_column="vuelo_ida_id",
    )
    vuelo_vuelta = models.ForeignKey(
        Vuelo,
        on_delete=models.PROTECT,
        related_name="salidas_vuelta",
        null=True,
        blank=True,
        db_column="vuelo_vuelta_id",
    )
    cupos_totales = models.PositiveIntegerField()
    cupos_disponibles = models.PositiveIntegerField()

    class Meta:
        db_table = "paquete_salidas"
        verbose_name = "Salida de paquete"
        verbose_name_plural = "Salidas de paquetes"
        ordering = ["fecha_salida"]
        constraints = [
            models.UniqueConstraint(
                fields=["paquete", "fecha_salida"],
                name="ux_salidas_paquete_fecha",
            ),
            models.CheckConstraint(
                check=models.Q(cupos_disponibles__lte=models.F("cupos_totales")),
                name="ck_salidas_cupos",
            ),
        ]
        indexes = [
            models.Index(fields=["fecha_salida"], name="ix_salidas_fecha"),
        ]

    def __str__(self):
        return f"{self.paquete_id} · {self.fecha_salida}"