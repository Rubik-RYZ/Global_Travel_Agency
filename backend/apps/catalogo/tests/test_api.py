"""Tests del API de catálogo (CU3–CU4)."""
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.catalogo.models import (
    Aeropuerto,
    Destino,
    Hotel,
    ItinerarioDia,
    Paquete,
    PaqueteSalida,
    Proveedor,
    Vuelo,
)
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


@pytest.mark.django_db
def test_crear_proveedor_con_logo(client_admin):
    r = client_admin.post(BASE_P, {
        "nombre": "Sky Air",
        "tipo": "aerolinea",
        "logo_url": "https://res.cloudinary.com/demo/image/upload/illimani/proveedores/sky.png",
        "logo_public_id": "illimani/proveedores/sky",
    }, format="json")
    assert r.status_code == 201
    assert r.json()["logo_url"].endswith("sky.png")
    assert r.json()["logo_public_id"] == "illimani/proveedores/sky"


@pytest.mark.django_db
def test_actualizar_logo_proveedor(client_admin, proveedor):
    r = client_admin.patch(
        f"{BASE_P}{proveedor.id}/",
        {"logo_url": None, "logo_public_id": None},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["logo_url"] is None
    proveedor.refresh_from_db()
    assert proveedor.logo_public_id is None


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


# ── Vuelos (CU4) ──────────────────────────────────────────────────────────────

BASE_V = "/api/v1/vuelos/"


@pytest.fixture
def aeropuerto_lpb(db):
    destino_lp = Destino.objects.create(nombre="La Paz", pais="Bolivia")
    return Aeropuerto.objects.create(
        codigo_iata="LPB", nombre="El Alto", destino=destino_lp
    )


@pytest.fixture
def aeropuerto_vvi(db):
    destino_sc = Destino.objects.create(nombre="Santa Cruz", pais="Bolivia")
    return Aeropuerto.objects.create(
        codigo_iata="VVI", nombre="Viru Viru", destino=destino_sc
    )


@pytest.fixture
def vuelo(db, proveedor, aeropuerto_lpb, aeropuerto_vvi):
    salida = timezone.now() + timedelta(days=15)
    return Vuelo.objects.create(
        proveedor=proveedor,
        numero_vuelo="OB 123",
        origen=aeropuerto_lpb,
        destino=aeropuerto_vvi,
        salida=salida,
        llegada=salida + timedelta(hours=1, minutes=30),
        precio="850.00",
        moneda="USD",
        cupos_totales=120,
        cupos_disponibles=120,
    )


def _payload_vuelo(aeropuerto_lpb, aeropuerto_vvi, proveedor, **extra):
    salida = timezone.now() + timedelta(days=20)
    data = {
        "proveedor": proveedor.id,
        "numero_vuelo": "ob 456",
        "origen": aeropuerto_lpb.pk,
        "destino": aeropuerto_vvi.pk,
        "salida": salida.isoformat(),
        "llegada": (salida + timedelta(hours=2)).isoformat(),
        "precio": "920.00",
        "moneda": "usd",
        "cupos_totales": 100,
        "cupos_disponibles": 100,
    }
    data.update(extra)
    return data


@pytest.mark.django_db
def test_anon_no_puede_listar_vuelos(client_anon, vuelo):
    r = client_anon.get(BASE_V)
    assert r.status_code in (401, 403)


@pytest.mark.django_db
def test_cliente_no_puede_listar_vuelos(client_cliente, vuelo):
    r = client_cliente.get(BASE_V)
    assert r.status_code == 403


@pytest.mark.django_db
def test_listar_vuelos_personal(client_admin, vuelo):
    r = client_admin.get(BASE_V)
    assert r.status_code == 200
    assert r.json()["count"] == 1
    fila = r.json()["results"][0]
    assert fila["numero_vuelo"] == "OB 123"
    assert fila["proveedor_nombre"] == "Andes Air"
    assert fila["origen_nombre"] == "El Alto"
    assert fila["destino_nombre"] == "Viru Viru"


@pytest.mark.django_db
def test_crear_vuelo_admin(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    r = client_admin.post(
        BASE_V,
        _payload_vuelo(aeropuerto_lpb, aeropuerto_vvi, proveedor),
        format="json",
    )
    assert r.status_code == 201, r.json()
    cuerpo = r.json()
    assert cuerpo["numero_vuelo"] == "OB 456"
    assert cuerpo["moneda"] == "USD"
    assert cuerpo["proveedor_nombre"] == "Andes Air"


@pytest.mark.django_db
def test_crear_vuelo_hereda_cupos_disponibles(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    payload = _payload_vuelo(aeropuerto_lpb, aeropuerto_vvi, proveedor)
    payload.pop("cupos_disponibles")
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 201, r.json()
    assert r.json()["cupos_disponibles"] == 100


@pytest.mark.django_db
def test_vuelo_origen_igual_destino_rechazado(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    payload = _payload_vuelo(
        aeropuerto_lpb, aeropuerto_vvi, proveedor, destino=aeropuerto_lpb.pk
    )
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 400
    assert "destino" in r.json()["detail"]


@pytest.mark.django_db
def test_vuelo_llegada_antes_de_salida_rechazado(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    salida = timezone.now() + timedelta(days=5)
    payload = _payload_vuelo(
        aeropuerto_lpb,
        aeropuerto_vvi,
        proveedor,
        salida=salida.isoformat(),
        llegada=(salida - timedelta(hours=1)).isoformat(),
    )
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 400
    assert "llegada" in r.json()["detail"]


@pytest.mark.django_db
def test_vuelo_cupos_mayores_al_total_rechazado(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    payload = _payload_vuelo(
        aeropuerto_lpb, aeropuerto_vvi, proveedor,
        cupos_totales=100, cupos_disponibles=200,
    )
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 400
    assert "cupos_disponibles" in r.json()["detail"]


@pytest.mark.django_db
def test_vuelo_moneda_invalida_rechazada(
    client_admin, proveedor, aeropuerto_lpb, aeropuerto_vvi
):
    payload = _payload_vuelo(
        aeropuerto_lpb, aeropuerto_vvi, proveedor, moneda="XYZ"
    )
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 400
    assert "moneda" in r.json()["detail"]


@pytest.mark.django_db
def test_vuelo_proveedor_no_aerolinea_rechazado(
    client_admin, aeropuerto_lpb, aeropuerto_vvi
):
    hotel = Proveedor.objects.create(nombre="Hotel Sol", tipo="hotel")
    payload = _payload_vuelo(aeropuerto_lpb, aeropuerto_vvi, hotel)
    r = client_admin.post(BASE_V, payload, format="json")
    assert r.status_code == 400
    assert "proveedor" in r.json()["detail"]


@pytest.mark.django_db
def test_filtro_vuelos_por_ruta(client_admin, vuelo):
    r = client_admin.get(f"{BASE_V}?origen=LPB&destino=VVI")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    sin_ruta = client_admin.get(f"{BASE_V}?origen=VVI&destino=LPB")
    assert sin_ruta.json()["count"] == 0


@pytest.mark.django_db
def test_actualizar_vuelo(client_admin, vuelo):
    r = client_admin.patch(
        f"{BASE_V}{vuelo.id}/",
        {"precio": "780.50", "cupos_disponibles": 80},
        format="json",
    )
    assert r.status_code == 200, r.json()
    assert r.json()["precio"] == "780.50"
    assert r.json()["cupos_disponibles"] == 80


# ── Hoteles (CU5) ─────────────────────────────────────────────────────────────

BASE_H = "/api/v1/hoteles/"


@pytest.fixture
def proveedor_hotel(db):
    return Proveedor.objects.create(
        nombre="Casona Andina", tipo="hotel", ciudad="Cusco", activo=True
    )


@pytest.fixture
def hotel(db, proveedor_hotel, destino):
    return Hotel.objects.create(
        proveedor=proveedor_hotel,
        destino=destino,
        nombre="Posada del Inca",
        estrellas=4,
        direccion="Calle Suecia 345",
        latitud="-13.518000",
        longitud="-71.978000",
        activo=True,
    )


@pytest.fixture
def hotel_inactivo(db, proveedor_hotel, destino):
    return Hotel.objects.create(
        proveedor=proveedor_hotel,
        destino=destino,
        nombre="Ala Oeste",
        estrellas=3,
        activo=False,
    )


def _payload_hotel(proveedor_hotel, destino, **extra):
    data = {
        "proveedor": proveedor_hotel.id,
        "destino": destino.id,
        "nombre": "Mirador del Valle",
        "estrellas": 4,
        "direccion": "Av. Sol 120",
        "latitud": "-13.520000",
        "longitud": "-71.970000",
        "descripcion": "Vista al valle sagrado.",
    }
    data.update(extra)
    return data


@pytest.mark.django_db
def test_anon_solo_ve_hoteles_activos(client_anon, hotel, hotel_inactivo):
    r = client_anon.get(BASE_H)
    assert r.status_code == 200
    ids = [h["id"] for h in r.json()["results"]]
    assert hotel.id in ids
    assert hotel_inactivo.id not in ids


@pytest.mark.django_db
def test_listar_hoteles_admin_ve_todos(client_admin, hotel, hotel_inactivo):
    r = client_admin.get(BASE_H)
    assert r.status_code == 200
    assert r.json()["count"] == 2
    fila = next(h for h in r.json()["results"] if h["id"] == hotel.id)
    assert fila["proveedor_nombre"] == "Casona Andina"
    assert fila["destino_nombre"] == "Machu Picchu"


@pytest.mark.django_db
def test_cliente_no_puede_crear_hotel(client_cliente, proveedor_hotel, destino):
    r = client_cliente.post(
        BASE_H, _payload_hotel(proveedor_hotel, destino), format="json"
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_crear_hotel_admin(client_admin, proveedor_hotel, destino):
    r = client_admin.post(
        BASE_H, _payload_hotel(proveedor_hotel, destino), format="json"
    )
    assert r.status_code == 201, r.json()
    cuerpo = r.json()
    assert cuerpo["nombre"] == "Mirador del Valle"
    assert cuerpo["estrellas"] == 4
    assert cuerpo["activo"] is True


@pytest.mark.django_db
def test_hotel_proveedor_no_hotel_rechazado(
    client_admin, proveedor, destino
):
    r = client_admin.post(
        BASE_H, _payload_hotel(proveedor, destino), format="json"
    )
    assert r.status_code == 400
    assert "proveedor" in r.json()["detail"]


@pytest.mark.django_db
def test_hotel_estrellas_fuera_de_rango_rechazado(
    client_admin, proveedor_hotel, destino
):
    r = client_admin.post(
        BASE_H,
        _payload_hotel(proveedor_hotel, destino, estrellas=9),
        format="json",
    )
    assert r.status_code == 400
    assert "estrellas" in r.json()["detail"]


@pytest.mark.django_db
def test_hotel_coordenadas_fuera_de_rango_rechazado(
    client_admin, proveedor_hotel, destino
):
    r = client_admin.post(
        BASE_H,
        _payload_hotel(proveedor_hotel, destino, latitud="95.000000"),
        format="json",
    )
    assert r.status_code == 400
    assert "latitud" in r.json()["detail"]


@pytest.mark.django_db
def test_actualizar_hotel(client_admin, hotel):
    r = client_admin.patch(
        f"{BASE_H}{hotel.id}/", {"estrellas": 5, "direccion": "Nueva 1"}, format="json"
    )
    assert r.status_code == 200, r.json()
    assert r.json()["estrellas"] == 5
    assert r.json()["direccion"] == "Nueva 1"


@pytest.mark.django_db
def test_toggle_activo_hotel(client_admin, hotel):
    r = client_admin.post(f"{BASE_H}{hotel.id}/toggle_activo/")
    assert r.status_code == 200
    assert r.json()["activo"] is False


@pytest.mark.django_db
def test_filtro_hoteles_por_destino(client_admin, hotel, destino):
    r = client_admin.get(f"{BASE_H}?destino={destino.id}")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    sin_hoteles = client_admin.get(f"{BASE_H}?destino=999")
    assert sin_hoteles.json()["count"] == 0


@pytest.mark.django_db
def test_eliminar_hotel(client_admin, hotel):
    r = client_admin.delete(f"{BASE_H}{hotel.id}/")
    assert r.status_code == 204
    assert not Hotel.objects.filter(pk=hotel.id).exists()


# ── Paquetes y salidas (CU6) ──────────────────────────────────────────────────

BASE_Q = "/api/v1/paquetes/"
BASE_S = "/api/v1/salidas/"


@pytest.fixture
def paquete(db, destino, hotel):
    return Paquete.objects.create(
        destino=destino,
        hotel=hotel,
        nombre="Cusco Esencial",
        descripcion="Cuatro días por el valle sagrado.",
        duracion_dias=4,
        precio_base="690.00",
        moneda="USD",
        etiquetas=["cultura", "trekking"],
        activo=True,
    )


@pytest.fixture
def paquete_inactivo(db, destino):
    return Paquete.objects.create(
        destino=destino,
        nombre="Ruta Reservada",
        duracion_dias=3,
        precio_base="500.00",
        moneda="USD",
        activo=False,
    )


@pytest.fixture
def salida(db, paquete):
    return PaqueteSalida.objects.create(
        paquete=paquete,
        fecha_salida="2026-12-15",
        cupos_totales=20,
        cupos_disponibles=20,
    )


def _payload_paquete(destino, hotel, **extra):
    data = {
        "destino": destino.id,
        "hotel": hotel.id,
        "nombre": "Valle Sagrado",
        "descripcion": "Oferta de temporada.",
        "duracion_dias": 5,
        "precio_base": "780.00",
        "moneda": "usd",
        "etiquetas": ["cultura"],
    }
    data.update(extra)
    return data


@pytest.mark.django_db
def test_anon_solo_ve_paquetes_activos(client_anon, paquete, paquete_inactivo):
    r = client_anon.get(BASE_Q)
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()["results"]]
    assert paquete.id in ids
    assert paquete_inactivo.id not in ids


@pytest.mark.django_db
def test_listar_paquetes_admin_ve_todos(client_admin, paquete, paquete_inactivo):
    r = client_admin.get(BASE_Q)
    assert r.status_code == 200
    assert r.json()["count"] == 2
    fila = next(p for p in r.json()["results"] if p["id"] == paquete.id)
    assert fila["destino_nombre"] == "Machu Picchu"
    assert fila["hotel_nombre"] == "Posada del Inca"
    assert fila["etiquetas"] == ["cultura", "trekking"]


@pytest.mark.django_db
def test_cliente_no_puede_crear_paquete(client_cliente, destino, hotel):
    r = client_cliente.post(
        BASE_Q, _payload_paquete(destino, hotel), format="json"
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_crear_paquete_admin(client_admin, destino, hotel):
    r = client_admin.post(
        BASE_Q, _payload_paquete(destino, hotel), format="json"
    )
    assert r.status_code == 201, r.json()
    cuerpo = r.json()
    assert cuerpo["nombre"] == "Valle Sagrado"
    assert cuerpo["moneda"] == "USD"
    assert cuerpo["etiquetas"] == ["cultura"]
    assert cuerpo["salidas"] == []


@pytest.mark.django_db
def test_paquete_duracion_cero_rechazado(client_admin, destino, hotel):
    r = client_admin.post(
        BASE_Q,
        _payload_paquete(destino, hotel, duracion_dias=0),
        format="json",
    )
    assert r.status_code == 400
    assert "duracion_dias" in r.json()["detail"]


@pytest.mark.django_db
def test_paquete_precio_negativo_rechazado(client_admin, destino, hotel):
    r = client_admin.post(
        BASE_Q,
        _payload_paquete(destino, hotel, precio_base="-10.00"),
        format="json",
    )
    assert r.status_code == 400
    assert "precio_base" in r.json()["detail"]


@pytest.mark.django_db
def test_paquete_moneda_invalida_rechazada(client_admin, destino, hotel):
    r = client_admin.post(
        BASE_Q,
        _payload_paquete(destino, hotel, moneda="XYZ"),
        format="json",
    )
    assert r.status_code == 400
    assert "moneda" in r.json()["detail"]


@pytest.mark.django_db
def test_toggle_activo_paquete(client_admin, paquete):
    r = client_admin.post(f"{BASE_Q}{paquete.id}/toggle_activo/")
    assert r.status_code == 200
    assert r.json()["activo"] is False


@pytest.mark.django_db
def test_detalle_paquete_incluye_salidas(client_anon, paquete, salida):
    r = client_anon.get(f"{BASE_Q}{paquete.id}/")
    assert r.status_code == 200
    assert len(r.json()["salidas"]) == 1
    assert r.json()["salidas"][0]["fecha_salida"] == "2026-12-15"


@pytest.mark.django_db
def test_filtro_paquetes_por_destino(client_admin, paquete, destino):
    r = client_admin.get(f"{BASE_Q}?destino={destino.id}")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    sin_paquetes = client_admin.get(f"{BASE_Q}?destino=999")
    assert sin_paquetes.json()["count"] == 0


@pytest.mark.django_db
def test_filtro_paquetes_por_etiqueta(client_admin, paquete):
    r = client_admin.get(f"{BASE_Q}?etiqueta=cultura")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    sin_etiqueta = client_admin.get(f"{BASE_Q}?etiqueta=playa")
    assert sin_etiqueta.json()["count"] == 0


@pytest.mark.django_db
def test_crear_salida_admin(client_admin, paquete):
    r = client_admin.post(
        BASE_S,
        {
            "paquete": paquete.id,
            "fecha_salida": "2027-01-20",
            "cupos_totales": 18,
            "cupos_disponibles": 18,
        },
        format="json",
    )
    assert r.status_code == 201, r.json()
    assert r.json()["fecha_salida"] == "2027-01-20"
    assert r.json()["paquete_nombre"] == "Cusco Esencial"


@pytest.mark.django_db
def test_salida_hereda_cupos_disponibles(client_admin, paquete, salida):
    r = client_admin.post(
        BASE_S,
        {
            "paquete": paquete.id,
            "fecha_salida": "2027-02-10",
            "cupos_totales": 18,
        },
        format="json",
    )
    assert r.status_code == 201, r.json()
    assert r.json()["cupos_disponibles"] == 18


@pytest.mark.django_db
def test_salida_fecha_duplicada_rechazada(client_admin, paquete, salida):
    r = client_admin.post(
        BASE_S,
        {
            "paquete": paquete.id,
            "fecha_salida": "2026-12-15",
            "cupos_totales": 10,
            "cupos_disponibles": 10,
        },
        format="json",
    )
    assert r.status_code == 400
    assert "fecha_salida" in r.json()["detail"]


@pytest.mark.django_db
def test_salida_cupos_mayores_al_total_rechazado(client_admin, paquete):
    r = client_admin.post(
        BASE_S,
        {
            "paquete": paquete.id,
            "fecha_salida": "2027-03-01",
            "cupos_totales": 10,
            "cupos_disponibles": 12,
        },
        format="json",
    )
    assert r.status_code == 400
    assert "cupos_disponibles" in r.json()["detail"]


@pytest.mark.django_db
def test_filtro_salidas_por_paquete(client_admin, paquete, salida):
    r = client_admin.get(f"{BASE_S}?paquete={paquete.id}")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    sin_salidas = client_admin.get(f"{BASE_S}?paquete=999")
    assert sin_salidas.json()["count"] == 0


@pytest.mark.django_db
def test_filtro_salidas_disponibles(client_anon, salida):
    r = client_anon.get(f"{BASE_S}?disponibles=1")
    assert r.status_code == 200
    assert r.json()["count"] == 1

    salida.cupos_disponibles = 0
    salida.save(update_fields=["cupos_disponibles"])
    agotadas = client_anon.get(f"{BASE_S}?disponibles=1")
    assert agotadas.json()["count"] == 0


@pytest.mark.django_db
def test_actualizar_salida(client_admin, salida):
    r = client_admin.patch(
        f"{BASE_S}{salida.id}/", {"cupos_disponibles": 12}, format="json"
    )
    assert r.status_code == 200, r.json()
    assert r.json()["cupos_disponibles"] == 12


@pytest.mark.django_db
def test_eliminar_salida(client_admin, salida):
    r = client_admin.delete(f"{BASE_S}{salida.id}/")
    assert r.status_code == 204
    assert not PaqueteSalida.objects.filter(pk=salida.id).exists()
