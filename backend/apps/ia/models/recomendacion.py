"""Recomendación de paquete generada para un cliente (CU11)."""
from django.db import models


class Recomendacion(models.Model):
    """Paquete sugerido a un cliente, con su puntaje y respuesta."""

    cliente = models.ForeignKey(
        "usuarios.Cliente",
        on_delete=models.CASCADE,
        related_name="recomendaciones",
        db_column="cliente_id",
    )
    paquete = models.ForeignKey(
        "catalogo.Paquete",
        on_delete=models.CASCADE,
        related_name="recomendaciones",
        db_column="paquete_id",
    )
    modelo = models.ForeignKey(
        "ia.ModeloIA",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recomendaciones",
        db_column="modelo_id",
    )
    puntaje = models.DecimalField(max_digits=6, decimal_places=4)
    mostrada = models.BooleanField(default=False)
    aceptada = models.BooleanField(null=True, blank=True)
    generada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recomendaciones"
        verbose_name = "Recomendación"
        verbose_name_plural = "Recomendaciones"
        ordering = ["-generada_en"]
        indexes = [
            models.Index(
                fields=["cliente", "-generada_en"],
                name="ix_recomendaciones_cliente",
            ),
        ]

    def __str__(self):
        return f"{self.cliente_id} -> {self.paquete_id} ({self.puntaje})"
