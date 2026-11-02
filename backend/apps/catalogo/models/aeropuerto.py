"""Aeropuerto asociado a un destino (CU3)."""
from django.db import models


class Aeropuerto(models.Model):
    """Aeropuerto identificado por su código IATA."""

    codigo_iata = models.CharField(max_length=3, primary_key=True)
    nombre = models.TextField()
    destino = models.ForeignKey(
        "catalogo.Destino", on_delete=models.PROTECT, db_column="destino_id"
    )

    class Meta:
        db_table = "aeropuertos"
        verbose_name = "Aeropuerto"
        verbose_name_plural = "Aeropuertos"

    def __str__(self):
        return f"{self.codigo_iata} · {self.nombre}"
