"""Cliente (viajero) y sus preferencias (CU2)."""
from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.usuarios.constants import DOCUMENTO_TIPOS, MONEDAS


class Cliente(models.Model):
    """Cliente (viajero). Puede existir sin usuario de sistema (alta presencial)."""

    usuario = models.OneToOneField(
        "usuarios.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="usuario_id",
    )
    nombres = models.TextField()
    apellidos = models.TextField()
    documento_tipo = models.TextField(
        null=True, blank=True, choices=DOCUMENTO_TIPOS
    )
    documento_numero = models.TextField(null=True, blank=True)
    telefono = models.TextField(null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    pais_origen = models.TextField(null=True, blank=True)
    # Documentos de viaje digitalizados. Se guardan la URL pública y
    # el identificador del almacén para poder reemplazarlos o borrarlos.
    pasaporte_url = models.TextField(null=True, blank=True)
    pasaporte_public_id = models.TextField(null=True, blank=True)
    carnet_url = models.TextField(null=True, blank=True)
    carnet_public_id = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "clientes"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}".strip()


class ClientePreferencia(models.Model):
    """Preferencias del cliente (alimentan al recomendador — CU11)."""

    cliente = models.OneToOneField(
        "usuarios.Cliente",
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="cliente_id",
    )
    presupuesto_max = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    moneda = models.CharField(max_length=3, default="USD", choices=MONEDAS)
    intereses = ArrayField(models.TextField(), default=list)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cliente_preferencias"
        verbose_name = "Preferencias de cliente"
        verbose_name_plural = "Preferencias de clientes"
        constraints = [
            models.CheckConstraint(
                check=models.Q(presupuesto_max__gte=0)
                | models.Q(presupuesto_max__isnull=True),
                name="ck_preferencias_presupuesto",
            ),
        ]

    def __str__(self):
        return f"Preferencias de {self.cliente_id}"
