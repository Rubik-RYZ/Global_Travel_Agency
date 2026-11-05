"""Rol del sistema (CU1)."""
from django.db import models


class Rol(models.Model):
    """Catálogo fijo de roles (administrador, agente, cliente)."""

    id = models.SmallIntegerField(primary_key=True)
    nombre = models.TextField(unique=True)

    class Meta:
        db_table = "roles"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre
