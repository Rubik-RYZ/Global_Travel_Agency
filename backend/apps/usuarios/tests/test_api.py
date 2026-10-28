"""Tests de la API de CU1 (endpoints de acceso, equipo y auditoría)."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Auditoria, Cliente, ClientePreferencia, Rol, Usuario


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


class ClientesPreferenciasAPITest(BaseAPITest):
    """CU2 · directorio de viajeros (panel) y área privada del viajero."""

    def setUp(self):
        super().setUp()
        self.ficha = Cliente.objects.create(
            usuario=self.cliente, nombres="Ana", apellidos="Quispe Mamani"
        )

    # --- Panel: /clientes ---
    def test_directorio_prohibido_para_cliente(self):
        token = self.autenticar_cliente()
        respuesta = self.client.get(
            "/api/v1/clientes/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lista_directorio(self):
        token = self.autenticar_admin()
        respuesta = self.client.get(
            "/api/v1/clientes/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["count"], 1)

    def test_admin_crea_viajero_presencial(self):
        token = self.autenticar_admin()
        respuesta = self.client.post(
            "/api/v1/clientes/",
            {"nombres": "Carlos", "apellidos": "Mamani", "documento_tipo": "PASAPORTE"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(respuesta.data["usuario"])
        self.assertTrue(Cliente.objects.filter(apellidos="Mamani").exists())

    def test_agente_lee_pero_no_crea(self):
        Usuario.objects.create_user(
            email="agente@test.bo", password="Agente12345", rol_id=2
        )
        login = self.client.post(
            "/api/v1/auth/login",
            {"email": "agente@test.bo", "password": "Agente12345"},
            format="json",
        )
        token = login.data["access"]
        cabecera = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        lectura = self.client.get("/api/v1/clientes/", **cabecera)
        self.assertEqual(lectura.status_code, status.HTTP_200_OK)

        escritura = self.client.post(
            "/api/v1/clientes/", {"nombres": "X", "apellidos": "Y"},
            format="json", **cabecera,
        )
        self.assertEqual(escritura.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_elimina_viajero(self):
        token = self.autenticar_admin()
        respuesta = self.client.delete(
            f"/api/v1/clientes/{self.ficha.id}/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Cliente.objects.filter(id=self.ficha.id).exists())

    # --- Área privada: /me/perfil y /me/preferencias ---
    def test_admin_no_accede_al_area_del_viajero(self):
        token = self.autenticar_admin()
        respuesta = self.client.get(
            "/api/v1/me/perfil", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_cliente_ve_su_perfil(self):
        token = self.autenticar_cliente()
        respuesta = self.client.get(
            "/api/v1/me/perfil", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["nombres"], "Ana")
        self.assertEqual(respuesta.data["email"], "cli@test.bo")

    def test_cliente_actualiza_su_perfil(self):
        token = self.autenticar_cliente()
        respuesta = self.client.put(
            "/api/v1/me/perfil",
            {"nombres": "Ana Maria", "apellidos": "Quispe", "pais_origen": "Perú"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.ficha.refresh_from_db()
        self.assertEqual(self.ficha.nombres, "Ana Maria")

    def test_preferencias_se_crean_vacias_al_consultar(self):
        token = self.autenticar_cliente()
        respuesta = self.client.get(
            "/api/v1/me/preferencias", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["moneda"], "USD")
        self.assertEqual(respuesta.data["intereses"], [])

    def test_preferencias_normaliza_intereses(self):
        token = self.autenticar_cliente()
        respuesta = self.client.put(
            "/api/v1/me/preferencias",
            {"presupuesto_max": "2500.00", "moneda": "USD",
             "intereses": ["Playa", "playa", "CULTURAL"]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["intereses"], ["playa", "cultural"])

    def test_preferencias_rechaza_interes_desconocido(self):
        token = self.autenticar_cliente()
        respuesta = self.client.put(
            "/api/v1/me/preferencias",
            {"intereses": ["buceo"]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_actualizacion_de_perfil_queda_en_auditoria(self):
        token = self.autenticar_cliente()
        self.client.put(
            "/api/v1/me/perfil",
            {"nombres": "Ana Maria", "apellidos": "Quispe"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertTrue(Auditoria.objects.filter(accion="perfil_actualizado").exists())
