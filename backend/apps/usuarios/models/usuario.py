"""Usuario del sistema y su integración con Django (CU1)."""
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.usuarios.constants import ROL_ADMINISTRADOR
from apps.usuarios.managers import UsuarioManager


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
    # Retrato del miembro del equipo (Fase 3b), en el almacén externo.
    foto_url = models.TextField(null=True, blank=True)
    foto_public_id = models.TextField(null=True, blank=True)
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
