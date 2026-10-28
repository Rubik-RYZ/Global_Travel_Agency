"""Tests del API de catálogo (CU3)."""
import pytest
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, ItinerarioDia, Proveedor
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


@pytest.mark.django_db
def test_crear_proveedor_con_ficha_operativa(client_admin):
    r = client_admin.post(BASE_P, {
        "nombre": "Casona paceña",
        "tipo": "hotel",
        "pais": "Bolivia",
        "ciudad": "La Paz",
        "contacto": "Reservas",
        "notas": "Hospedaje patrimonial en Sopocachi.",
    }, format="json")
    assert r.status_code == 201, r.json()
    cuerpo = r.json()
    assert cuerpo["pais"] == "Bolivia"
    assert cuerpo["ciudad"] == "La Paz"
    assert cuerpo["contacto"] == "Reservas"
    assert "Sopocachi" in cuerpo["notas"]


@pytest.mark.django_db
def test_filtro_pais_y_busqueda_proveedor(client_admin):
    Proveedor.objects.create(nombre="Hotel Titikaka", tipo="hotel", pais="Bolivia", ciudad="Copacabana")
    Proveedor.objects.create(nombre="Cusco Guides", tipo="operador", pais="Perú", ciudad="Cusco")

    r = client_admin.get(f"{BASE_P}?pais=Bolivia")
    assert [p["nombre"] for p in r.json()["results"]] == ["Hotel Titikaka"]

    r = client_admin.get(f"{BASE_P}?q=Cusco")
    assert [p["nombre"] for p in r.json()["results"]] == ["Cusco Guides"]


@pytest.mark.django_db
def test_actualizar_ficha_proveedor(client_admin, proveedor):
    r = client_admin.patch(f"{BASE_P}{proveedor.id}/", {
        "ciudad": "El Alto",
        "notas": "Renovó flota en 2026.",
    }, format="json")
    assert r.status_code == 200
    assert r.json()["ciudad"] == "El Alto"
    assert r.json()["notas"] == "Renovó flota en 2026."


# ── Destinos: ficha comercial e itinerario ────────────────────────────────────

@pytest.fixture
def destino_comercial(db):
    destino = Destino.objects.create(
        nombre="Kioto y Takayama",
        pais="Japon",
        pais_codigo="jp",
        region="asia",
        resumen="Jardines de musgo y ryokans históricos.",
        caracter="cultural",
        duracion_dias=12,
        duracion_noches=11,
        precio_desde="6200.00",
        moneda="eur",
        mejor_epoca="Marzo a mayo (Sakura)",
        imagen_principal="/assets/destino-1.jpg",
        incluye=["Ryokan con onsen"],
        no_incluye=["Vuelos"],
        destacado=True,
        etiquetas=["cultural", "historia"],
    )
    ItinerarioDia.objects.create(
        destino=destino, numero_dia=1, titulo="Llegada a Tokio", ubicacion="Tokio"
    )
    ItinerarioDia.objects.create(
        destino=destino, numero_dia=2, titulo="Shinkansen a Kioto", ubicacion="Kioto"
    )
    return destino


@pytest.mark.django_db
def test_slug_y_codigos_normalizados(destino_comercial):
    assert destino_comercial.slug == "kioto-y-takayama-japon"
    assert destino_comercial.pais_codigo == "JP"
    assert destino_comercial.moneda == "EUR"


@pytest.mark.django_db
def test_resumen_listado_expone_campos_comerciales(client_anon, destino_comercial):
    r = client_anon.get(BASE_D)
    assert r.status_code == 200
    fila = next(d for d in r.json()["results"] if d["nombre"] == "Kioto y Takayama")
    assert fila["region_display"] == "Asia"
    assert fila["caracter_display"] == "Cultural y patrimonial"
    assert fila["duracion_dias"] == 12
    assert fila["precio_desde"] == "6200.00"
    assert fila["imagen_principal"] == "/assets/destino-1.jpg"
    assert fila["destacado"] is True


@pytest.mark.django_db
def test_detalle_incluye_itinerario_ordenado(client_anon, destino_comercial):
    r = client_anon.get(f"{BASE_D}{destino_comercial.id}/")
    assert r.status_code == 200
    data = r.json()
    assert [d["numero_dia"] for d in data["itinerario"]] == [1, 2]
    assert data["incluye"] == ["Ryokan con onsen"]
    assert data["region_display"] == "Asia"


@pytest.mark.django_db
def test_filtro_region_y_caracter(client_anon, destino_comercial, destino):
    por_region = client_anon.get(f"{BASE_D}?region=asia")
    assert por_region.json()["count"] == 1
    por_caracter = client_anon.get(f"{BASE_D}?caracter=cultural")
    assert por_caracter.json()["count"] == 1
    assert por_caracter.json()["results"][0]["nombre"] == "Kioto y Takayama"


@pytest.mark.django_db
def test_filtro_destacado(client_anon, destino_comercial, destino):
    r = client_anon.get(f"{BASE_D}?destacado=true")
    assert r.status_code == 200
    nombres = [d["nombre"] for d in r.json()["results"]]
    assert nombres == ["Kioto y Takayama"]


@pytest.mark.django_db
def test_moneda_invalida_rechazada(client_admin):
    r = client_admin.post(BASE_D, {
        "nombre": "Ruta Rara",
        "pais": "Chile",
        "moneda": "XYZ",
    }, format="json")
    assert r.status_code == 400
    assert "moneda" in r.json()["detail"]


@pytest.mark.django_db
def test_crear_destino_con_atributos_comerciales(client_admin):
    r = client_admin.post(BASE_D, {
        "nombre": "Fiordos Noruegos",
        "pais": "Noruega",
        "pais_codigo": "no",
        "region": "europa",
        "caracter": "naturaleza",
        "duracion_dias": 7,
        "precio_desde": "2400.00",
        "moneda": "eur",
        "destacado": True,
    }, format="json")
    assert r.status_code == 201, r.json()
    data = r.json()
    assert data["slug"] == "fiordos-noruegos-noruega"
    assert data["region_display"] == "Europa"
    assert data["moneda"] == "EUR"


@pytest.mark.django_db
def test_precio_negativo_rechazado(client_admin):
    r = client_admin.post(BASE_D, {
        "nombre": "Ruta Imposible",
        "pais": "Narnia",
        "precio_desde": "-10.00",
    }, format="json")
    assert r.status_code == 400


# ── Destinos: diario de ruta (itinerario día a día) ───────────────────────────

@pytest.mark.django_db
def test_definir_itinerario_admin(client_admin, destino_comercial):
    r = client_admin.put(f"{BASE_D}{destino_comercial.id}/itinerario/", [
        {"numero_dia": 1, "titulo": "Llegada a Osaka", "ubicacion": "Osaka"},
        {"numero_dia": 2, "titulo": "Tren a Kioto", "descripcion": "Shinkansen."},
        {"numero_dia": 3, "titulo": "Bosques de Takayama", "ubicacion": "Takayama"},
    ], format="json")
    assert r.status_code == 200, r.json()
    assert [d["numero_dia"] for d in r.json()] == [1, 2, 3]
    detalle = client_admin.get(f"{BASE_D}{destino_comercial.id}/").json()
    assert [d["titulo"] for d in detalle["itinerario"]] == [
        "Llegada a Osaka", "Tren a Kioto", "Bosques de Takayama",
    ]


@pytest.mark.django_db
def test_definir_itinerario_reemplaza_dias_previos(client_admin, destino_comercial):
    client_admin.put(f"{BASE_D}{destino_comercial.id}/itinerario/", [
        {"numero_dia": 1, "titulo": "Único día"},
    ], format="json")
    destino_comercial.refresh_from_db()
    assert destino_comercial.itinerario.count() == 1


@pytest.mark.django_db
def test_definir_itinerario_duplicado_rechazado(client_admin, destino_comercial):
    r = client_admin.put(f"{BASE_D}{destino_comercial.id}/itinerario/", [
        {"numero_dia": 1, "titulo": "Día uno"},
        {"numero_dia": 1, "titulo": "Repetido"},
    ], format="json")
    assert r.status_code == 400
    assert "numero_dia" in r.json()


@pytest.mark.django_db
def test_definir_itinerario_sin_titulo_rechazado(client_admin, destino_comercial):
    r = client_admin.put(f"{BASE_D}{destino_comercial.id}/itinerario/", [
        {"numero_dia": 1, "titulo": "   "},
    ], format="json")
    assert r.status_code == 400
    assert "titulo" in r.content.decode()


@pytest.mark.django_db
def test_cliente_no_puede_definir_itinerario(client_cliente, destino_comercial):
    r = client_cliente.put(f"{BASE_D}{destino_comercial.id}/itinerario/", [
        {"numero_dia": 1, "titulo": "Intruso"},
    ], format="json")
    assert r.status_code == 403
