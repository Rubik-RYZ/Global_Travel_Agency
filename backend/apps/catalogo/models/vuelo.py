"""Vuelo de una aerolínea proveedora (CU4)."""
from django.db import models

from apps.catalogo.models.aeropuerto import Aeropuerto
from apps.catalogo.models.proveedor import Proveedor


class Vuelo(models.Model):
    """Salida concreta de una aerolínea: ruta, horario, tarifa y cupos."""

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name="vuelos",
        db_column="proveedor_id",
    )
    numero_vuelo = models.TextField()
    origen = models.ForeignKey(
        Aeropuerto,
        on_delete=models.PROTECT,
        related_name="vuelos_salida",
        db_column="origen",
    )
    destino = models.ForeignKey(
        Aeropuerto,
        on_delete=models.PROTECT,
        related_name="vuelos_llegada",
        db_column="destino",
    )
    salida = models.DateTimeField()
    llegada = models.DateTimeField()
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, default="USD")
    cupos_totales = models.IntegerField()
    cupos_disponibles = models.IntegerField()
    referencia_externa = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "vuelos"
        verbose_name = "Vuelo"
        verbose_name_plural = "Vuelos"
        ordering = ["salida"]
        constraints = [
            models.UniqueConstraint(
                fields=["numero_vuelo", "salida"],
                name="ux_vuelos_numero_salida",
            ),
            models.CheckConstraint(
                check=~models.Q(origen=models.F("destino")),
                name="ck_vuelos_ruta_distinta",
            ),
            models.CheckConstraint(
                check=models.Q(llegada__gt=models.F("salida")),
                name="ck_vuelos_horario",
            ),
            models.CheckConstraint(
                check=models.Q(cupos_disponibles__lte=models.F("cupos_totales")),
                name="ck_vuelos_cupos",
            ),
            models.CheckConstraint(
                check=models.Q(precio__gte=0),
                name="ck_vuelos_precio",
            ),
            models.CheckConstraint(
                check=models.Q(cupos_totales__gte=0),
                name="ck_vuelos_cupos_totales",
            ),
            models.CheckConstraint(
                check=models.Q(cupos_disponibles__gte=0),
                name="ck_vuelos_cupos_disponibles",
            ),
            models.CheckConstraint(
                check=models.Q(moneda__in=["BOB", "USD", "EUR"]),
                name="ck_vuelos_moneda",
            ),
        ]
        indexes = [
            models.Index(
                fields=["origen", "destino", "salida"],
                name="ix_vuelos_ruta",
            ),
        ]

    def __str__(self):
        return f"{self.numero_vuelo} · {self.origen_id}→{self.destino_id}"