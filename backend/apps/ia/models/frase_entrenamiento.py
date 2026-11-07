"""Frases de entrenamiento asociadas a una intención (CU10)."""
from django.db import models


class FraseEntrenamiento(models.Model):
    """Ejemplo de texto etiquetado con la intención que representa."""

    ORIGEN_MANUAL = "manual"
    ORIGEN_HISTORIAL = "historial"
    ORIGEN_CHOICES = [
        (ORIGEN_MANUAL, "Carga manual"),
        (ORIGEN_HISTORIAL, "Extraída del historial"),
    ]

    intencion = models.ForeignKey(
        "ia.Intencion",
        on_delete=models.CASCADE,
        related_name="frases",
        db_column="intencion_id",
    )
    texto = models.TextField()
    origen = models.TextField(
        choices=ORIGEN_CHOICES,
        default=ORIGEN_MANUAL,
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "frases_entrenamiento"
        verbose_name = "Frase de entrenamiento"
        verbose_name_plural = "Frases de entrenamiento"
        ordering = ["intencion", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["intencion", "texto"],
                name="ux_frases_entrenamiento_intencion_texto",
            ),
            models.CheckConstraint(
                check=models.Q(origen__in=["manual", "historial"]),
                name="ck_frases_entrenamiento_origen",
            ),
        ]

    def __str__(self):
        return f"{self.texto[:60]} ({self.intencion_id})"
