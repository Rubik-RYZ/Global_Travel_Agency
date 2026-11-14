from django.db import models

class Mensaje(models.Model):
    EMISOR_USUARIO = "usuario"
    EMISOR_AGENTE = "agente"
    EMISOR_CHOICES = [
        (EMISOR_USUARIO, "Usuario"),
        (EMISOR_AGENTE, "Agente"),
    ]

    conversacion = models.ForeignKey(
        "ia.Conversacion",
        on_delete=models.CASCADE,
        related_name="mensajes",
        db_column="conversacion_id",
    )
    emisor = models.TextField(choices=EMISOR_CHOICES)
    texto = models.TextField()
    intencion = models.ForeignKey(
        "ia.Intencion",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mensajes",
        db_column="intencion_id",
    )
    confianza = models.DecimalField(
        max_digits=4, decimal_places=3, null=True, blank=True
    )
    entidades = models.JSONField(null=True, blank=True)
    modelo = models.ForeignKey(
        "ia.ModeloIA",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mensajes",
        db_column="modelo_id",
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "mensajes"
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"
        ordering = ["creado_en", "id"]
        indexes = [
            models.Index(
                fields=["conversacion", "creado_en"],
                name="ix_mensajes_conversacion",
            ),
            models.Index(
                fields=["intencion"],
                name="ix_mensajes_intencion",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(emisor__in=["usuario", "agente"]),
                name="ck_mensajes_emisor",
            ),
            models.CheckConstraint(
                check=models.Q(confianza__gte=0, confianza__lte=1)
                | models.Q(confianza__isnull=True),
                name="ck_mensajes_confianza",
            ),
        ]

    def __str__(self):
        return f"{self.emisor}: {self.texto[:60]}"
