"""Modelo de notificaciones al cliente (CU8)."""
from django.db import models


class Notificacion(models.Model):
    """Registro de notificaciones y avisos transaccionales por viajero."""

    TIPO_CONFIRMACION = "confirmacion_reserva"
    TIPO_PAGO = "comprobante_pago"
    TIPO_ITINERARIO = "itinerario"

    TIPO_CHOICES = [
        (TIPO_CONFIRMACION, "Confirmación de reserva"),
        (TIPO_PAGO, "Comprobante de pago"),
        (TIPO_ITINERARIO, "Envío de itinerario"),
    ]

    ESTADO_PENDIENTE = "pendiente"
    ESTADO_ENVIADA = "enviada"
    ESTADO_FALLIDA = "fallida"

    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_ENVIADA, "Enviada"),
        (ESTADO_FALLIDA, "Fallida"),
    ]

    usuario = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.CASCADE,
        related_name="notificaciones",
        db_column="usuario_id",
    )
    reserva = models.ForeignKey(
        "reservas.Reserva",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones",
        db_column="reserva_id",
    )
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default=ESTADO_PENDIENTE)
    resend_message_id = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notificaciones"
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.tipo} ({self.estado}) para {self.usuario.email}"

