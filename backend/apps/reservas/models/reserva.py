"""Modelo principal de reservas (CU7)."""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, Q


class Reserva(models.Model):
    """Reserva de plazas para una salida programada de un paquete turístico."""

    ESTADO_PENDIENTE = "pendiente"
    ESTADO_CONFIRMADA = "confirmada"
    ESTADO_PAGADA = "pagada"
    ESTADO_CANCELADA = "cancelada"

    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, "Pendiente de pago"),
        (ESTADO_CONFIRMADA, "Confirmada"),
        (ESTADO_PAGADA, "Pagada"),
        (ESTADO_CANCELADA, "Cancelada"),
    ]

    CANAL_WEB = "web"
    CANAL_AGENTE = "agente"
    CANAL_PERSONAL = "personal"

    CANAL_CHOICES = [
        (CANAL_WEB, "Portal web"),
        (CANAL_AGENTE, "Asistente conversacional"),
        (CANAL_PERSONAL, "Atención presencial / mostrador"),
    ]

    MONEDA_CHOICES = [
        ("BOB", "Bolivianos"),
        ("USD", "Dólares estadounidenses"),
        ("EUR", "Euros"),
    ]

    codigo = models.CharField(max_length=30, unique=True, editable=False)
    cliente = models.ForeignKey(
        "usuarios.Cliente",
        on_delete=models.PROTECT,
        related_name="reservas",
        db_column="cliente_id",
    )
    salida = models.ForeignKey(
        "catalogo.PaqueteSalida",
        on_delete=models.PROTECT,
        related_name="reservas",
        db_column="salida_id",
    )
    num_personas = models.PositiveSmallIntegerField(help_text="Número total de viajeros")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default=ESTADO_PENDIENTE)
    total = models.DecimalField(max_digits=12, decimal_places=2, help_text="Importe total liquidado")
    moneda = models.CharField(max_length=3, choices=MONEDA_CHOICES, default="USD")
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default=CANAL_WEB)
    conversacion_id = models.UUIDField(null=True, blank=True, help_text="Conversación origen si fue creada por chatbot")
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reservas"
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"
        ordering = ["-creada_en"]
        indexes = [
            models.Index(fields=["cliente"], name="ix_reservas_cliente"),
            models.Index(fields=["salida"], name="ix_reservas_salida"),
            models.Index(fields=["estado"], name="ix_reservas_estado"),
        ]
        constraints = [
            CheckConstraint(
                check=Q(num_personas__gt=0),
                name="reservas_num_personas_positivo",
            ),
            CheckConstraint(
                check=Q(total__gte=0),
                name="reservas_total_no_negativo",
            ),
        ]

    def clean(self):
        super().clean()
        if self.num_personas is not None and self.num_personas <= 0:
            raise ValidationError({"num_personas": "El número de viajeros debe ser al menos 1."})
        if self.total is not None and self.total < 0:
            raise ValidationError({"total": "El total de la reserva no puede ser negativo."})

    def __str__(self):
        return f"{self.codigo} · {self.cliente.nombre_completo} ({self.estado})"

