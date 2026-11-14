from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

class Pago(models.Model):
    class Moneda(models.TextChoices):
        BOB = "BOB", "Boliviano"
        USD = "USD", "Dólar"
        EUR = "EUR", "Euro"

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        APROBADO = "aprobado", "Aprobado"
        FALLIDO = "fallido", "Fallido"
        REEMBOLSADO = "reembolsado", "Reembolsado"

    reserva = models.ForeignKey(
        "reservas.Reserva", on_delete=models.PROTECT, related_name="pagos"
    )
    monto = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    moneda = models.CharField(max_length=3, choices=Moneda.choices)
    tipo_cambio_a_bob = models.DecimalField(
        max_digits=14, decimal_places=6, default=Decimal("1")
    )
    monto_bob = models.DecimalField(max_digits=14, decimal_places=2)
    metodo = models.TextField(default="tarjeta")
    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.PENDIENTE
    )

    stripe_payment_id = models.TextField(unique=True, null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pagos"
        indexes = [models.Index(fields=["reserva"], name="ix_pagos_reserva")]
        constraints = [
            models.CheckConstraint(check=Q(monto__gt=0), name="ck_pagos_monto_pos"),
            models.CheckConstraint(check=Q(monto_bob__gt=0), name="ck_pagos_monto_bob_pos"),
            models.CheckConstraint(check=Q(tipo_cambio_a_bob__gt=0), name="ck_pagos_tc_pos"),
        ]

    def __str__(self):
        return f"Pago {self.pk} - {self.reserva_id} - {self.monto} {self.moneda}"
