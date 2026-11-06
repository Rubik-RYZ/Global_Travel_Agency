"""Tests para el módulo de gestión de vuelos (CU4)."""
from datetime import timedelta
from decimal import Decimal
import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Aeropuerto, Destino, Proveedor, Vuelo
from apps.catalogo.services.vuelos import crear_vuelo, actualizar_vuelo, eliminar_vuelo
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Rol, Usuario

ROL_AGENTE = 2


@pytest.fixture
def setup_datos(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(email="admin_vuelo@test.bo", password="Password123", rol_id=ROL_ADMINISTRADOR)
    cliente = Usuario.objects.create_user(email="cli_vuelo@test.bo", password="Password123", rol_id=ROL_CLIENTE)

    destino = Destino.objects.create(nombre="Destino Vuelo", pais="Bolivia", region="america_del_sur")
    aero_orig = Aeropuerto.objects.create(codigo_iata="VLP", nombre="Aeropuerto La Paz Test", destino=destino)
    aero_dest = Aeropuerto.objects.create(codigo_iata="VSC", nombre="Aeropuerto Santa Cruz Test", destino=destino)

    aerolinea = Proveedor.objects.create(
        nombre="Test Air", tipo="aerolinea", pais="Bolivia", ciudad="La Paz"
    )

    return {
        "admin": admin,
        "cliente": cliente,
        "aero_orig": aero_orig,
        "aero_dest": aero_dest,
        "aerolinea": aerolinea,
    }


@pytest.mark.django_db
def test_creacion_vuelo_servicio_exitoso(setup_datos):
    d = setup_datos
    ahora = timezone.now() + timedelta(days=2)
    llegada = ahora + timedelta(hours=2)

    vuelo = crear_vuelo(
        proveedor_id=d["aerolinea"].id,
        numero_vuelo="TA-101",
        origen_codigo=d["aero_orig"].codigo_iata,
        destino_codigo=d["aero_dest"].codigo_iata,
        salida=ahora,
        llegada=llegada,
        precio=Decimal("150.00"),
        moneda="USD",
        cupos_totales=50,
        cupos_disponibles=50,
    )

    assert vuelo.id is not None
    assert vuelo.numero_vuelo == "TA-101"
    assert vuelo.cupos_disponibles == 50
    assert vuelo.origen == d["aero_orig"]


@pytest.mark.django_db
def test_validacion_origen_igual_destino(setup_datos):
    d = setup_datos
    ahora = timezone.now() + timedelta(days=1)
    with pytest.raises(ValidationError):
        crear_vuelo(
            proveedor_id=d["aerolinea"].id,
            numero_vuelo="TA-ERR1",
            origen_codigo=d["aero_orig"].codigo_iata,
            destino_codigo=d["aero_orig"].codigo_iata,
            salida=ahora,
            llegada=ahora + timedelta(hours=1),
            precio=Decimal("100.00"),
            cupos_totales=30,
        )


@pytest.mark.django_db
def test_validacion_llegada_anterior_salida(setup_datos):
    d = setup_datos
    ahora = timezone.now() + timedelta(days=1)
    with pytest.raises(ValidationError):
        crear_vuelo(
            proveedor_id=d["aerolinea"].id,
            numero_vuelo="TA-ERR2",
            origen_codigo=d["aero_orig"].codigo_iata,
            destino_codigo=d["aero_dest"].codigo_iata,
            salida=ahora,
            llegada=ahora - timedelta(hours=1),
            precio=Decimal("100.00"),
            cupos_totales=30,
        )


@pytest.mark.django_db
def test_api_vuelos_crud_permisos(setup_datos):
    d = setup_datos
    client_admin = APIClient()
    client_admin.force_authenticate(user=d["admin"])

    client_cli = APIClient()
    client_cli.force_authenticate(user=d["cliente"])

    ahora = timezone.now() + timedelta(days=5)
    payload = {
        "proveedor_id": d["aerolinea"].id,
        "numero_vuelo": "TA-500",
        "origen_codigo": d["aero_orig"].codigo_iata,
        "destino_codigo": d["aero_dest"].codigo_iata,
        "salida": ahora.isoformat(),
        "llegada": (ahora + timedelta(hours=3)).isoformat(),
        "precio": "250.00",
        "moneda": "USD",
        "cupos_totales": 60,
        "cupos_disponibles": 60,
    }

    # Cliente no puede crear
    res_cli = client_cli.post("/api/v1/vuelos/", payload, format="json")
    assert res_cli.status_code == status.HTTP_403_FORBIDDEN

    # Admin sí puede crear
    res_admin = client_admin.post("/api/v1/vuelos/", payload, format="json")
    assert res_admin.status_code == status.HTTP_201_CREATED
    vuelo_id = res_admin.data["id"]

    # Listado público / accesible
    res_list = client_cli.get("/api/v1/vuelos/")
    assert res_list.status_code == status.HTTP_200_OK
    assert len(res_list.data["results"]) >= 1

