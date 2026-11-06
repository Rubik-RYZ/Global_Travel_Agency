"""Managers del dominio de usuarios."""
from django.contrib.auth.base_user import BaseUserManager

from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE


class UsuarioManager(BaseUserManager):
    """Manager de `Usuario` con login por email (case-insensitive)."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("rol_id", ROL_CLIENTE)
        extra_fields.setdefault("activo", True)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("rol_id", ROL_ADMINISTRADOR)
        extra_fields.setdefault("activo", True)
        return self._create_user(email, password, **extra_fields)

    def get_by_natural_key(self, username):
        return self.get(**{f"{self.model.USERNAME_FIELD}__iexact": username})
