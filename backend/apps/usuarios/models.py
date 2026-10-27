"""Capa de dominio: usuarios, seguridad, clientes y preferencias.

Las FK entre apps se declaran SIEMPRE como string para evitar imports
circulares (regla de AGENT.md).
"""
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.usuarios.constants import (
    DOCUMENTO_TIPOS,
    MONEDAS,
    ROL_ADMINISTRADOR,
)
from apps.usuarios.managers import UsuarioManager


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


class Usuario(AbstractBaseUser):
    """Usuario del sistema (autenticación por email, bcrypt cost 10).

    Se apoya en `rol` en lugar de `PermissionsMixin` para no generar tablas
    extra fuera del esquema (`auth_group`, `auth_permission`, etc.). Los
    permisos de Django se derivan del rol.
    """

    email = models.TextField()
    rol = models.ForeignKey(
        "usuarios.Rol", on_delete=models.PROTECT, db_column="rol_id"
    )
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    # Columna `ultimo_acceso` del esquema; se expone también como propiedad.
    last_login = models.DateTimeField(
        null=True, blank=True, db_column="ultimo_acceso"
    )
    # AbstractBaseUser define `password`; lo remapeamos a la columna del esquema.
    password = models.TextField(db_column="password_hash")

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        constraints = [
            models.UniqueConstraint(Lower("email"), name="ux_usuarios_email"),
        ]

    def __str__(self):
        return self.email

    # --- Alias de dominio en español ---
    @property
    def ultimo_acceso(self):
        return self.last_login

    # --- Integración con Django (rol en lugar de PermissionsMixin) ---
    @property
    def is_active(self):
        return self.activo

    @property
    def is_staff(self):
        return self.rol_id == ROL_ADMINISTRADOR

    @property
    def is_superuser(self):
        return self.rol_id == ROL_ADMINISTRADOR

    def has_perm(self, perm, obj=None):
        return self.rol_id == ROL_ADMINISTRADOR

    def has_module_perms(self, app_label):
        return self.rol_id == ROL_ADMINISTRADOR

    def registrar_acceso(self):
        self.last_login = timezone.now()
        self.save(update_fields=["last_login"])


class Auditoria(models.Model):
    """Bitácora de seguridad: logins, cambios y acciones relevantes."""

    usuario = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="usuario_id",
    )
    accion = models.TextField()
    entidad = models.TextField(null=True, blank=True)
    entidad_id = models.TextField(null=True, blank=True)
    detalle = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria"
        verbose_name = "Registro de auditoría"
        verbose_name_plural = "Bitácora de auditoría"
        indexes = [
            models.Index(fields=["usuario", "-creado_en"], name="ix_auditoria_usuario"),
        ]

    def __str__(self):
        return f"{self.creado_en:%Y-%m-%d %H:%M} · {self.accion}"


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
