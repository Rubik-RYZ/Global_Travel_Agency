import uuid

from django.db import models

class Recomendacion(models.Model):
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

    lote = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
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
