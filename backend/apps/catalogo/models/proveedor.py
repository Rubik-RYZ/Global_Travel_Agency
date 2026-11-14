from django.db import models

from apps.catalogo.constants import TIPOS_PROVEEDOR

class Proveedor(models.Model):
    nombre = models.TextField(unique=True)
    tipo = models.TextField(choices=TIPOS_PROVEEDOR)
    pais = models.TextField(null=True, blank=True)
    ciudad = models.TextField(null=True, blank=True)
    contacto = models.TextField(null=True, blank=True)
    email = models.TextField(null=True, blank=True)
    telefono = models.TextField(null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    logo_url = models.TextField(null=True, blank=True)
    logo_public_id = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "proveedores"
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        indexes = [models.Index(fields=["tipo"], name="ix_proveedores_tipo")]

    def __str__(self):
        return self.nombre
