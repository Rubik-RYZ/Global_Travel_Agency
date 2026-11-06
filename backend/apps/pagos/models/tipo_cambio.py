from django.db import models
from django.db.models import F, Q

from .pago import Pago


class TipoCambio(models.Model):
    fecha = models.DateField()
    moneda_origen = models.CharField(max_length=3, choices=Pago.Moneda.choices)
    moneda_destino = models.CharField(max_length=3, choices=Pago.Moneda.choices)
    tasa = models.DecimalField(max_digits=14, decimal_places=6)

    class Meta:
        db_table = "tipos_cambio"
        constraints = [
            models.UniqueConstraint(
                fields=["fecha", "moneda_origen", "moneda_destino"],
                name="ux_tipos_cambio_fecha_par",
            ),
            models.CheckConstraint(check=Q(tasa__gt=0), name="ck_tipos_cambio_tasa_pos"),
        ]

    def __str__(self):
        return f"{self.fecha} {self.moneda_origen}->{self.moneda_destino}: {self.tasa}"