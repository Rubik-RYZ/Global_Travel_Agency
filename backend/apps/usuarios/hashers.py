"""Hashers de contraseña del proyecto."""
from django.contrib.auth.hashers import BCryptSHA256PasswordHasher


class BCrypt10PasswordHasher(BCryptSHA256PasswordHasher):
    """bcrypt con cost 10 (según AGENT.md)."""

    rounds = 10
