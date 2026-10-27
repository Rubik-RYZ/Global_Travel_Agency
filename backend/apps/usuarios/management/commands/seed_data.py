"""Comando `seed_data`: puebla datos iniciales realistas.

Fase 0: roles + usuarios de prueba (administrador y cliente).
Las fases siguientes agregan destinos, proveedores, paquetes y salidas.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.usuarios.constants import (
    ROL_ADMINISTRADOR,
    ROL_CLIENTE,
    ROLES_INICIALES,
)
from apps.usuarios.models import Cliente, Rol, Usuario


class Command(BaseCommand):
    help = "Puebla la base de datos con datos iniciales (roles, usuarios de prueba)."

    @transaction.atomic
    def handle(self, *args, **options):
        self._seed_roles()
        self._seed_admin()
        self._seed_cliente()
        self.stdout.write(self.style.SUCCESS("✔ seed_data completado."))

    def _seed_roles(self):
        for rol_id, nombre in ROLES_INICIALES:
            Rol.objects.update_or_create(id=rol_id, defaults={"nombre": nombre})
        self.stdout.write("  · roles listos (administrador, agente, cliente)")

    def _seed_admin(self):
        email = "admin@illimanitravel.bo"
        usuario, creado = Usuario.objects.get_or_create(
            email=email,
            defaults={"rol_id": ROL_ADMINISTRADOR, "activo": True},
        )
        if creado:
            usuario.set_password("Admin12345")
            usuario.save(update_fields=["password"])
            self.stdout.write(f"  · admin creado: {email} / Admin12345")
        else:
            self.stdout.write(f"  · admin ya existía: {email}")

    def _seed_cliente(self):
        email = "cliente@illimanitravel.bo"
        usuario, creado = Usuario.objects.get_or_create(
            email=email,
            defaults={"rol_id": ROL_CLIENTE, "activo": True},
        )
        if creado:
            usuario.set_password("Cliente12345")
            usuario.save(update_fields=["password"])

        Cliente.objects.get_or_create(
            usuario=usuario,
            defaults={
                "nombres": "Ana",
                "apellidos": "Quispe Mamani",
                "documento_tipo": "CI",
                "documento_numero": "9876543",
                "pais_origen": "Bolivia",
            },
        )
        if creado:
            self.stdout.write(f"  · cliente creado: {email} / Cliente12345")
        else:
            self.stdout.write(f"  · cliente ya existía: {email}")
