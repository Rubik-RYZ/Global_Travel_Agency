"""Tests del API de catálogo (CU3)."""
import pytest
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Proveedor
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Rol, Usuario

ROL_AGENTE = 2

# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def roles(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})


@pytest.fixture
def client_anon():
    return APIClient()


@pytest.fixture
def admin(db, roles):
    return Usuario.objects.create_user(
        email="admin_cat@test.bo", password="Admin12345", rol_id=ROL_ADMINISTRADOR
    )


@pytest.fixture
def agente(db, roles):
    return Usuario.objects.create_user(
        email="agente_cat@test.bo", password="Test12345", rol_id=ROL_AGENTE
    )


@pytest.fixture
def cliente_usr(db, roles):
    return Usuario.objects.create_user(
        email="cliente_cat@test.bo", password="Test12345", rol_id=ROL_CLIENTE
    )


@pytest.fixture
def client_admin(admin):
    c = APIClient()
    c.force_authenticate(user=admin)
    return c


@pytest.fixture
def client_agente(agente):
    c = APIClient()
    c.force_authenticate(user=agente)
    return c


@pytest.fixture
def client_cliente(cliente_usr):
    c = APIClient()
    c.force_authenticate(user=cliente_usr)
    return c


@pytest.fixture
def destino(db):
    return Destino.objects.create(
        nombre="Machu Picchu",
        pais="Perú",
        descripcion="La ciudadela inca sobre las nubes.",
        latitud=-13.163,
        longitud=-72.545,
        etiquetas=["inca", "naturaleza", "patrimonio"],
        activo=True,
    )


@pytest.fixture
def destino_inactivo(db):
    return Destino.objects.create(
        nombre="Ruta Secreta",
        pais="Bolivia",
        etiquetas=["reservado"],
        activo=False,
    )


@pytest.fixture
def proveedor(db):
    return Proveedor.objects.create(
        nombre="Andes Air", tipo="aerolinea", email="ops@andesair.bo", activo=True
    )


# URLs base (el router catalogo se registra en api/v1/ directamente)
BASE_D = "/api/v1/destinos/"
BASE_P = "/api/v1/proveedores/"


# ── Destinos: lectura pública ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_destinos_publico(client_anon, destino, destino_inactivo):
    """Anónimo solo ve destinos activos."""
    r = client_anon.get(BASE_D)
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()["results"]]
    assert destino.id in ids
    assert destino_inactivo.id not in ids


@pytest.mark.django_db
def test_detalle_destino_publico(client_anon, destino):
    r = client_anon.get(f"{BASE_D}{destino.id}/")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Machu Picchu"


@pytest.mark.django_db
def test_filtro_pais(client_anon, destino):
    r = client_anon.get(f"{BASE_D}?pais=Perú")
    assert r.status_code == 200
    assert any(d["nombre"] == "Machu Picchu" for d in r.json()["results"])


@pytest.mark.django_db
def test_filtro_q(client_anon, destino):
    r = client_anon.get(f"{BASE_D}?q=machu")
    assert r.status_code == 200
    assert r.json()["count"] >= 1


@pytest.mark.django_db
def test_filtro_etiqueta(client_anon, destino):
    r = client_anon.get(f"{BASE_D}?etiqueta=inca")
    assert r.status_code == 200
    assert r.json()["count"] >= 1


# ── Destinos: escritura admin/agente ──────────────────────────────────────────

@pytest.mark.django_db
def test_crear_destino_admin(client_admin):
    r = client_admin.post(BASE_D, {
        "nombre": "Salar de Uyuni",
        "pais": "Bolivia",
        "descripcion": "El espejo del cielo.",
        "etiquetas": ["naturaleza", "altiplano"],
    }, format="json")
    assert r.status_code == 201
    assert r.json()["nombre"] == "Salar de Uyuni"


@pytest.mark.django_db
def test_crear_destino_agente(client_agente):
    r = client_agente.post(BASE_D, {
        "nombre": "Tiwanaku",
        "pais": "Bolivia",
        "etiquetas": ["arqueología"],
    }, format="json")
    assert r.status_code == 201


@pytest.mark.django_db
def test_crear_destino_duplicado(client_admin, destino):
    r = client_admin.post(BASE_D, {
        "nombre": "Machu Picchu",
        "pais": "Perú",
    }, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cliente_no_puede_crear_destino(client_cliente):
    r = client_cliente.post(BASE_D, {
        "nombre": "Nuevo Destino",
        "pais": "Bolivia",
    }, format="json")
    assert r.status_code == 403


@pytest.mark.django_db
def test_anon_no_puede_crear_destino(client_anon):
    r = client_anon.post(BASE_D, {
        "nombre": "Otro Destino",
        "pais": "Brasil",
    }, format="json")
    assert r.status_code in (401, 403)


@pytest.mark.django_db
def test_actualizar_destino(client_admin, destino):
    r = client_admin.patch(
        f"{BASE_D}{destino.id}/",
        {"descripcion": "Actualizado."},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["descripcion"] == "Actualizado."


@pytest.mark.django_db
def test_toggle_activo_destino(client_admin, destino):
    assert destino.activo is True
    r = client_admin.post(f"{BASE_D}{destino.id}/toggle_activo/")
    assert r.status_code == 200
    assert r.json()["activo"] is False


@pytest.mark.django_db
def test_admin_ve_destinos_inactivos(client_admin, destino, destino_inactivo):
    r = client_admin.get(BASE_D)
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()["results"]]
    assert destino_inactivo.id in ids


# ── Proveedores ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_proveedores_admin(client_admin, proveedor):
    r = client_admin.get(BASE_P)
    assert r.status_code == 200
    assert r.json()["count"] >= 1


@pytest.mark.django_db
def test_anon_no_puede_listar_proveedores(client_anon, proveedor):
    r = client_anon.get(BASE_P)
    assert r.status_code in (401, 403)


@pytest.mark.django_db
def test_crear_proveedor_admin(client_admin):
    r = client_admin.post(BASE_P, {
        "nombre": "Hoteles Inca",
        "tipo": "hotel",
        "email": "reservas@incahotels.pe",
    }, format="json")
    assert r.status_code == 201
    assert r.json()["tipo_display"] == "Hotel"


@pytest.mark.django_db
def test_crear_proveedor_tipo_invalido(client_admin):
    r = client_admin.post(BASE_P, {
        "nombre": "Raro",
        "tipo": "inexistente",
    }, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_crear_proveedor_duplicado(client_admin, proveedor):
    r = client_admin.post(BASE_P, {
        "nombre": "Andes Air",
        "tipo": "aerolinea",
    }, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_toggle_activo_proveedor(client_admin, proveedor):
    assert proveedor.activo is True
    r = client_admin.post(f"{BASE_P}{proveedor.id}/toggle_activo/")
    assert r.status_code == 200
    assert r.json()["activo"] is False


@pytest.mark.django_db
def test_filtro_tipo_proveedor(client_admin, proveedor):
    r = client_admin.get(f"{BASE_P}?tipo=aerolinea")
    assert r.status_code == 200
    assert all(p["tipo"] == "aerolinea" for p in r.json()["results"])
