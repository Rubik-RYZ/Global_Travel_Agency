"""Capa de dominio del catálogo turístico (CU3 · destinos y proveedores).

Vuelos, hoteles, paquetes y salidas (CU4–CU6) se agregan en el Sprint 3.
Las FK entre apps se declaran como string.
"""
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models

from apps.catalogo.constants import TIPOS_PROVEEDOR


class Destino(models.Model):
    """Destino turístico internacional (con coordenadas para Leaflet)."""

    nombre = models.TextField()
    pais = models.TextField()
    descripcion = models.TextField(null=True, blank=True)
    latitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    etiquetas = ArrayField(models.TextField(), default=list)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "destinos"
        verbose_name = "Destino"
        verbose_name_plural = "Destinos"
        constraints = [
            models.UniqueConstraint(
                fields=["nombre", "pais"], name="ux_destinos_nombre_pais"
            ),
            models.CheckConstraint(
                check=models.Q(latitud__gte=-90, latitud__lte=90)
                | models.Q(latitud__isnull=True),
                name="ck_destinos_latitud",
            ),
            models.CheckConstraint(
                check=models.Q(longitud__gte=-180, longitud__lte=180)
                | models.Q(longitud__isnull=True),
                name="ck_destinos_longitud",
            ),
        ]
        indexes = [GinIndex(fields=["etiquetas"], name="ix_destinos_etiquetas")]

    def __str__(self):
        return f"{self.nombre}, {self.pais}"


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


class Proveedor(models.Model):
    """Proveedor de servicios (aerolínea, hotel, transporte, operador)."""

    nombre = models.TextField(unique=True)
    tipo = models.TextField(choices=TIPOS_PROVEEDOR)
    email = models.TextField(null=True, blank=True)
    telefono = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "proveedores"
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        indexes = [models.Index(fields=["tipo"], name="ix_proveedores_tipo")]

    def __str__(self):
        return self.nombre
