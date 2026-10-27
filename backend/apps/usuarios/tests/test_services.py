"""Tests de la capa de negocio de CU1 (services)."""
from django.core import mail
from django.core import signing
from django.test import TestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed, ValidationError

from apps.usuarios import services
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Auditoria, Cliente, Rol, Usuario


class BaseServicesTest(TestCase):
    def setUp(self):
        Rol.objects.create(id=ROL_ADMINISTRADOR, nombre="administrador")
        Rol.objects.create(id=2, nombre="agente")
        Rol.objects.create(id=ROL_CLIENTE, nombre="cliente")
        self.usuario = Usuario.objects.create_user(
            email="user@test.bo", password="Secreta123", rol_id=ROL_CLIENTE
        )


class AutenticarTest(BaseServicesTest):
    def test_login_exitoso_registra_auditoria_y_acceso(self):
        usuario, tokens = services.autenticar(
            email="USER@test.bo", password="Secreta123"
        )
        self.assertEqual(usuario.id, self.usuario.id)
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)

        usuario.refresh_from_db()
        self.assertIsNotNone(usuario.ultimo_acceso)
        self.assertTrue(Auditoria.objects.filter(accion="login").exists())

    def test_login_fallido_registra_intento(self):
        with self.assertRaises(AuthenticationFailed):
            services.autenticar(email="user@test.bo", password="mala")
        self.assertTrue(Auditoria.objects.filter(accion="login_fallido").exists())

    def test_login_usuario_inexistente_registra_intento(self):
        with self.assertRaises(AuthenticationFailed):
            services.autenticar(email="nadie@test.bo", password="x")
        registro = Auditoria.objects.get(accion="login_fallido")
        self.assertIsNone(registro.usuario)


class RegistrarClienteTest(BaseServicesTest):
    def test_registra_usuario_y_cliente(self):
        usuario, cliente = services.registrar_cliente(
            email="nuevo@test.bo",
            password="Nuevo12345",
            nombres="Luis",
            apellidos="Perez",
        )
        self.assertEqual(usuario.rol_id, ROL_CLIENTE)
        self.assertTrue(usuario.check_password("Nuevo12345"))
        self.assertEqual(cliente.usuario_id, usuario.id)
        self.assertTrue(Auditoria.objects.filter(accion="registro_cliente").exists())

    def test_email_duplicado_lanza_validacion(self):
        with self.assertRaises(ValidationError):
            services.registrar_cliente(
                email="user@test.bo",
                password="Nuevo12345",
                nombres="X",
                apellidos="Y",
            )


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class RecuperacionTest(BaseServicesTest):
    def test_solicitar_envia_email(self):
        services.solicitar_recuperacion(email="user@test.bo")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("restablecer", mail.outbox[0].body.lower())
        self.assertTrue(Auditoria.objects.filter(accion="recuperar_solicitado").exists())

    def test_solicitar_email_inexistente_no_envia(self):
        services.solicitar_recuperacion(email="nadie@test.bo")
        self.assertEqual(len(mail.outbox), 0)

    def test_flujo_completo_restablecer(self):
        token = signing.dumps({"uid": self.usuario.id}, salt=services.SALT_RECUPERACION)
        services.restablecer_password(token=token, password="Cambiada123")
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password("Cambiada123"))
        self.assertTrue(Auditoria.objects.filter(accion="password_restablecido").exists())

    def test_token_invalido(self):
        with self.assertRaises(ValidationError):
            services.restablecer_password(token="basura", password="Cambiada123")

    def test_token_expirado(self):
        from unittest import mock

        token = signing.dumps({"uid": self.usuario.id}, salt=services.SALT_RECUPERACION)
        with mock.patch.object(services, "TOKEN_RECUPERACION_MAX_AGE", -1):
            with self.assertRaises(ValidationError):
                services.restablecer_password(token=token, password="Cambiada123")


class EquipoTest(BaseServicesTest):
    def setUp(self):
        super().setUp()
        self.actor = Usuario.objects.create_user(
            email="admin@test.bo", password="Secreta123", rol_id=ROL_ADMINISTRADOR
        )

    def test_crear_usuario_equipo(self):
        usuario = services.crear_usuario_equipo(
            datos={
                "email": "agente@test.bo",
                "password": "Agente123",
                "rol_id": 2,
                "activo": True,
            },
            actor=self.actor,
        )
        self.assertEqual(usuario.rol_id, 2)
        self.assertTrue(Auditoria.objects.filter(accion="usuario_creado").exists())

    def test_actualizar_cambia_rol_y_password(self):
        usuario = services.actualizar_usuario_equipo(
            usuario=self.usuario,
            datos={"rol_id": 2, "password": "Nueva12345"},
            actor=self.actor,
        )
        self.assertEqual(usuario.rol_id, 2)
        self.assertTrue(usuario.check_password("Nueva12345"))
        self.assertTrue(Auditoria.objects.filter(accion="usuario_actualizado").exists())

    def test_desactivar_no_borra(self):
        services.desactivar_usuario_equipo(usuario=self.usuario, actor=self.actor)
        self.usuario.refresh_from_db()
        self.assertFalse(self.usuario.activo)
        self.assertTrue(Usuario.objects.filter(id=self.usuario.id).exists())


class SeedRolesTest(TestCase):
    def test_hay_roles_base(self):
        Rol.objects.create(id=1, nombre="administrador")
        self.assertTrue(Rol.objects.filter(nombre="administrador").exists())
        self.assertTrue(Cliente.objects.count() == 0)
