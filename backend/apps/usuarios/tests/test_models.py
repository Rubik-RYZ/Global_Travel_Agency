"""Tests de modelos de CU1 (usuarios, roles, clientes, auditoría)."""
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.usuarios.constants import ROL_CLIENTE
from apps.usuarios.models import Auditoria, Cliente, Rol, Usuario


class RolModelTest(TestCase):
    def test_str_devuelve_nombre(self):
        rol = Rol.objects.create(id=9, nombre="observador")
        self.assertEqual(str(rol), "observador")


class UsuarioModelTest(TestCase):
    def setUp(self):
        self.rol = Rol.objects.create(id=ROL_CLIENTE, nombre="cliente")

    def test_crear_usuario_normaliza_email(self):
        usuario = Usuario.objects.create_user(
            email="Mixed@Example.COM", password="Secreta123", rol_id=ROL_CLIENTE
        )
        self.assertEqual(usuario.email, "mixed@example.com")

    def test_password_se_hashea_con_bcrypt(self):
        usuario = Usuario.objects.create_user(
            email="a@b.bo", password="Secreta123", rol_id=ROL_CLIENTE
        )
        self.assertTrue(usuario.password.startswith("bcrypt"))
        self.assertTrue(usuario.check_password("Secreta123"))

    def test_email_es_unico_case_insensitive(self):
        Usuario.objects.create_user(
            email="dup@test.bo", password="Secreta123", rol_id=ROL_CLIENTE
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Usuario.objects.create_user(
                    email="DUP@test.bo", password="Secreta123", rol_id=ROL_CLIENTE
                )

    def test_propiedades_de_rol(self):
        admin_rol = Rol.objects.create(id=1, nombre="administrador")
        admin = Usuario.objects.create_superuser(
            email="root@test.bo", password="Secreta123"
        )
        self.assertEqual(admin.rol_id, admin_rol.id)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.has_perm("cualquiera"))

        cliente = Usuario.objects.create_user(
            email="cli@test.bo", password="Secreta123", rol_id=ROL_CLIENTE
        )
        self.assertFalse(cliente.is_staff)
        self.assertFalse(cliente.has_perm("cualquiera"))

    def test_registrar_acceso_actualiza_ultimo_acceso(self):
        usuario = Usuario.objects.create_user(
            email="acceso@test.bo", password="Secreta123", rol_id=ROL_CLIENTE
        )
        self.assertIsNone(usuario.ultimo_acceso)
        usuario.registrar_acceso()
        usuario.refresh_from_db()
        self.assertIsNotNone(usuario.ultimo_acceso)


class ClienteModelTest(TestCase):
    def test_nombre_completo(self):
        cliente = Cliente.objects.create(nombres="Ana", apellidos="Quispe")
        self.assertEqual(cliente.nombre_completo, "Ana Quispe")


class AuditoriaModelTest(TestCase):
    def test_str_contiene_accion(self):
        registro = Auditoria.objects.create(accion="login")
        self.assertIn("login", str(registro))
