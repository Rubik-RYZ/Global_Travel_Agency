"""Tests de la API de CU1 (endpoints de acceso, equipo y auditoría)."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Auditoria, Rol, Usuario


class BaseAPITest(APITestCase):
    def setUp(self):
        Rol.objects.create(id=ROL_ADMINISTRADOR, nombre="administrador")
        Rol.objects.create(id=2, nombre="agente")
        Rol.objects.create(id=ROL_CLIENTE, nombre="cliente")
        self.admin = Usuario.objects.create_user(
            email="admin@test.bo", password="Admin12345", rol_id=ROL_ADMINISTRADOR
        )
        self.cliente = Usuario.objects.create_user(
            email="cli@test.bo", password="Cliente12345", rol_id=ROL_CLIENTE
        )

    def autenticar_admin(self):
        respuesta = self.client.post(
            "/api/v1/auth/login",
            {"email": "admin@test.bo", "password": "Admin12345"},
            format="json",
        )
        return respuesta.data["access"]

    def autenticar_cliente(self):
        respuesta = self.client.post(
            "/api/v1/auth/login",
            {"email": "cli@test.bo", "password": "Cliente12345"},
            format="json",
        )
        return respuesta.data["access"]


class AccesoAPITest(BaseAPITest):
    def test_login_ok_devuelve_tokens_y_usuario(self):
        respuesta = self.client.post(
            "/api/v1/auth/login",
            {"email": "admin@test.bo", "password": "Admin12345"},
            format="json",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIn("access", respuesta.data)
        self.assertIn("refresh", respuesta.data)
        self.assertEqual(respuesta.data["usuario"]["rol"], "administrador")

    def test_login_fallido_401(self):
        respuesta = self.client.post(
            "/api/v1/auth/login",
            {"email": "admin@test.bo", "password": "mala"},
            format="json",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", respuesta.data)

    def test_me_requiere_autenticacion(self):
        respuesta = self.client.get("/api/v1/auth/me")
        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_devuelve_usuario(self):
        token = self.autenticar_admin()
        respuesta = self.client.get(
            "/api/v1/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["email"], "admin@test.bo")

    def test_registro_crea_cliente(self):
        respuesta = self.client.post(
            "/api/v1/auth/registro",
            {
                "email": "nuevo@test.bo",
                "password": "Nuevo12345",
                "nombres": "Luis",
                "apellidos": "Perez",
            },
            format="json",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data["usuario"]["rol"], "cliente")

    def test_logout_bloquea_refresh(self):
        respuesta = self.client.post(
            "/api/v1/auth/login",
            {"email": "admin@test.bo", "password": "Admin12345"},
            format="json",
        )
        access, refresh = respuesta.data["access"], respuesta.data["refresh"]

        salida = self.client.post(
            "/api/v1/auth/logout",
            {"refresh": refresh},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {access}",
        )
        self.assertEqual(salida.status_code, status.HTTP_204_NO_CONTENT)

        posterior = self.client.post(
            "/api/v1/auth/refresh", {"refresh": refresh}, format="json"
        )
        self.assertEqual(posterior.status_code, status.HTTP_401_UNAUTHORIZED)


class RolesEquipoAuditoriaAPITest(BaseAPITest):
    def test_roles_admin_ok(self):
        token = self.autenticar_admin()
        respuesta = self.client.get(
            "/api/v1/roles/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data), 3)

    def test_roles_cliente_prohibido(self):
        token = self.autenticar_cliente()
        respuesta = self.client.get(
            "/api/v1/roles/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_crear_usuario_equipo(self):
        token = self.autenticar_admin()
        respuesta = self.client.post(
            "/api/v1/usuarios/",
            {"email": "agente@test.bo", "password": "Agente123", "rol_id": 2},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(email="agente@test.bo").exists())

    def test_auditoria_registra_login(self):
        token = self.autenticar_admin()
        respuesta = self.client.get(
            "/api/v1/auditoria/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertTrue(Auditoria.objects.filter(accion="login").exists())

    def test_auditoria_cliente_prohibido(self):
        token = self.autenticar_cliente()
        respuesta = self.client.get(
            "/api/v1/auditoria/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)
