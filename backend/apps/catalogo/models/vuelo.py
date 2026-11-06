"""Modelo de vuelos gestionados por la agencia (CU4)."""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, F, Q, UniqueConstraint


class Vuelo(models.Model):
    """Vuelo regular o chárter contratado con aerolínea asociada."""

    MONEDA_CHOICES = [
        ("BOB", "Bolivianos"),
        ("USD", "Dólares estadounidenses"),
        ("EUR", "Euros"),
    ]

    proveedor = models.ForeignKey(
        "catalogo.Proveedor",
        on_delete=models.PROTECT,
        related_name="vuelos",
        db_column="proveedor_id",
        limit_choices_to={"tipo": "aerolinea"},
    )
    numero_vuelo = models.TextField(help_text="Código IATA del vuelo, ej. OB-1420 o LA-2401")
    origen = models.ForeignKey(
        "catalogo.Aeropuerto",
        on_delete=models.PROTECT,
        related_name="vuelos_salida",
        db_column="origen",
    )
    destino = models.ForeignKey(
        "catalogo.Aeropuerto",
        on_delete=models.PROTECT,
        related_name="vuelos_llegada",
        db_column="destino",
    )
    salida = models.DateTimeField(help_text="Fecha y hora de salida")
    llegada = models.DateTimeField(help_text="Fecha y hora de llegada")
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, choices=MONEDA_CHOICES, default="USD")
    cupos_totales = models.IntegerField()
    cupos_disponibles = models.IntegerField()
    referencia_externa = models.TextField(blank=True, null=True, help_text="Referencia externa o localizador GDS")

    class Meta:
        db_table = "vuelos"
        verbose_name = "Vuelo"
        verbose_name_plural = "Vuelos"
        ordering = ["salida", "numero_vuelo"]
        indexes = [
            models.Index(fields=["origen", "destino", "salida"], name="ix_vuelos_ruta"),
        ]
        constraints = [
            CheckConstraint(
                check=Q(precio__gte=0),
                name="vuelos_precio_no_negativo",
            ),
            CheckConstraint(
                check=Q(cupos_totales__gte=0),
                name="vuelos_cupos_totales_no_negativos",
            ),
            CheckConstraint(
                check=Q(cupos_disponibles__gte=0),
                name="vuelos_cupos_disponibles_no_negativos",
            ),
            CheckConstraint(
                check=Q(cupos_disponibles__lte=F("cupos_totales")),
                name="vuelos_cupos_disponibles_lte_totales",
            ),
            CheckConstraint(
                check=~Q(origen=F("destino")),
                name="vuelos_origen_distinto_destino",
            ),
            CheckConstraint(
                check=Q(llegada__gt=F("salida")),
                name="vuelos_llegada_posterior_salida",
            ),
            UniqueConstraint(
                fields=["numero_vuelo", "salida"],
                name="vuelos_numero_salida_uniq",
            ),
        ]

    def clean(self):
        super().clean()
        if self.origen_id and self.destino_id and self.origen_id == self.destino_id:
            raise ValidationError({"destino": "El aeropuerto de destino debe ser distinto al origen."})
        if self.salida and self.llegada and self.llegada <= self.salida:
            raise ValidationError({"llegada": "La hora de llegada debe ser posterior a la salida."})
        if self.cupos_disponibles is not None and self.cupos_totales is not None:
            if self.cupos_disponibles < 0:
                raise ValidationError({"cupos_disponibles": "Los cupos disponibles no pueden ser negativos."})
            if self.cupos_disponibles > self.cupos_totales:
                raise ValidationError({"cupos_disponibles": "Los cupos disponibles no pueden superar los totales."})
        if self.precio is not None and self.precio < 0:
            raise ValidationError({"precio": "El precio no puede ser negativo."})

    def __str__(self):
        return f"{self.numero_vuelo} ({self.origen_id} → {self.destino_id}) · {self.salida.strftime('%Y-%m-%d %H:%M')}"

