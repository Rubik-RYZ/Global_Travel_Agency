from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.usuarios.constants import ROL_ADMINISTRADOR
from apps.usuarios.managers import UsuarioManager

class Usuario(AbstractBaseUser):
    email = models.TextField()
    rol = models.ForeignKey(
        "usuarios.Rol", on_delete=models.PROTECT, db_column="rol_id"
    )
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    foto_url = models.TextField(null=True, blank=True)
    foto_public_id = models.TextField(null=True, blank=True)

    last_login = models.DateTimeField(
        null=True, blank=True, db_column="ultimo_acceso"
    )

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

    @property
    def ultimo_acceso(self):
        return self.last_login

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
