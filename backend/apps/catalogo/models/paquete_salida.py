"""Modelo de salidas programadas de paquetes turísticos (CU6)."""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, F, Q, UniqueConstraint


class PaqueteSalida(models.Model):
    """Fecha específica de salida para un paquete con cupos y vuelos asignados."""

    paquete = models.ForeignKey(
        "catalogo.Paquete",
        on_delete=models.CASCADE,
        related_name="salidas",
        db_column="paquete_id",
    )
    fecha_salida = models.DateField(help_text="Fecha de partida del viaje")
    vuelo_ida = models.ForeignKey(
        "catalogo.Vuelo",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="salidas_ida",
        db_column="vuelo_ida_id",
    )
    vuelo_vuelta = models.ForeignKey(
        "catalogo.Vuelo",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="salidas_vuelta",
        db_column="vuelo_vuelta_id",
    )
    cupos_totales = models.IntegerField(help_text="Cupo máximo de pasajeros para esta salida")
    cupos_disponibles = models.IntegerField(help_text="Cupos aún disponibles para reservar")

    class Meta:
        db_table = "paquete_salidas"
        verbose_name = "Salida programada"
        verbose_name_plural = "Salidas programadas"
        ordering = ["fecha_salida"]
        indexes = [
            models.Index(fields=["fecha_salida"], name="ix_salidas_fecha"),
        ]
        constraints = [
            CheckConstraint(
                check=Q(cupos_totales__gte=0),
                name="salidas_cupos_totales_no_negativos",
            ),
            CheckConstraint(
                check=Q(cupos_disponibles__gte=0),
                name="salidas_cupos_disponibles_no_negativos",
            ),
            CheckConstraint(
                check=Q(cupos_disponibles__lte=F("cupos_totales")),
                name="salidas_cupos_disponibles_lte_totales",
            ),
            UniqueConstraint(
                fields=["paquete", "fecha_salida"],
                name="salidas_paquete_fecha_uniq",
            ),
        ]

    def clean(self):
        super().clean()
        if self.cupos_disponibles is not None and self.cupos_totales is not None:
            if self.cupos_disponibles < 0:
                raise ValidationError({"cupos_disponibles": "Los cupos disponibles no pueden ser negativos."})
            if self.cupos_disponibles > self.cupos_totales:
                raise ValidationError({"cupos_disponibles": "Los cupos disponibles no pueden exceder los totales."})
        if self.vuelo_ida and self.vuelo_vuelta and self.vuelo_ida_id == self.vuelo_vuelta_id:
            raise ValidationError({"vuelo_vuelta": "El vuelo de vuelta debe ser distinto al de ida."})

    def __str__(self):
        return f"{self.paquete.nombre} · {self.fecha_salida.strftime('%d/%m/%Y')} ({self.cupos_disponibles}/{self.cupos_totales} cupos)"

