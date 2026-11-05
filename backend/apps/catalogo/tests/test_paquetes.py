"""Tests para el módulo de paquetes y salidas programadas (CU6)."""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Hotel, Paquete, PaqueteSalida, Proveedor
from apps.catalogo.services.paquetes import (
    crear_paquete,
    crear_salida,
    listar_paquetes,
    listar_salidas,
)
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Rol, Usuario

ROL_AGENTE = 2


@pytest.fixture
def setup_paquetes(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(email="admin_paq@test.bo", password="Password123", rol_id=ROL_ADMINISTRADOR)
    cliente = Usuario.objects.create_user(email="cli_paq@test.bo", password="Password123", rol_id=ROL_CLIENTE)

    destino = Destino.objects.create(nombre="Salar Expedición", pais="Bolivia", region="america_del_sur")
    prov_hotel = Proveedor.objects.create(nombre="Hotel Salar", tipo="hotel", pais="Bolivia")
    hotel = Hotel.objects.create(
        proveedor=prov_hotel, destino=destino, nombre="Hotel de Sal Luna Salada", estrellas=4
    )

    return {
        "admin": admin,
        "cliente": cliente,
        "destino": destino,
        "hotel": hotel,
    }


@pytest.mark.django_db
def test_creacion_paquete_y_salida_servicio(setup_paquetes):
    d = setup_paquetes
    paquete = crear_paquete(
        destino_id=d["destino"].id,
        hotel_id=d["hotel"].id,
        nombre="Expedición Fotográfica Salar",
        descripcion="3 días recorriendo el desierto blanco.",
        duracion_dias=3,
        precio_base=Decimal("380.00"),
        moneda="USD",
        etiquetas=["aventura", "altiplano"],
    )
    assert paquete.id is not None
    assert paquete.duracion_dias == 3
    assert "aventura" in paquete.etiquetas

    fecha = date.today() + timedelta(days=20)
    salida = crear_salida(
        paquete_id=paquete.id,
        fecha_salida=fecha,
        cupos_totales=15,
        cupos_disponibles=15,
    )
    assert salida.id is not None
    assert salida.cupos_disponibles == 15
    assert salida.fecha_salida == fecha


@pytest.mark.django_db
def test_validacion_salida_fecha_duplicada(setup_paquetes):
    d = setup_paquetes
    paquete = crear_paquete(
        destino_id=d["destino"].id,
        nombre="Ruta Breve",
        duracion_dias=2,
        precio_base=Decimal("150.00"),
    )
    fecha = date.today() + timedelta(days=10)
    crear_salida(paquete_id=paquete.id, fecha_salida=fecha, cupos_totales=10)

    with pytest.raises(ValidationError):
        crear_salida(paquete_id=paquete.id, fecha_salida=fecha, cupos_totales=12)


@pytest.mark.django_db
def test_api_paquetes_y_salidas_crud(setup_paquetes):
    d = setup_paquetes
    client_admin = APIClient()
    client_admin.force_authenticate(user=d["admin"])

    payload_paq = {
        "destino_id": d["destino"].id,
        "hotel_id": d["hotel"].id,
        "nombre": "Paquete API Test",
        "descripcion": "Descripción del paquete",
        "duracion_dias": 4,
        "precio_base": "420.00",
        "moneda": "USD",
        "etiquetas": ["test", "api"],
        "activo": True,
    }
    res_p = client_admin.post("/api/v1/paquetes/", payload_paq, format="json")
    assert res_p.status_code == status.HTTP_201_CREATED
    paquete_id = res_p.data["id"]

    # Crear salida
    fecha_sal = (date.today() + timedelta(days=30)).isoformat()
    payload_sal = {
        "paquete_id": paquete_id,
        "fecha_salida": fecha_sal,
        "cupos_totales": 20,
        "cupos_disponibles": 20,
    }
    res_s = client_admin.post("/api/v1/salidas/", payload_sal, format="json")
    assert res_s.status_code == status.HTTP_201_CREATED

    # Cliente puede listar públicamente los paquetes
    client_anon = APIClient()
    res_list = client_anon.get("/api/v1/paquetes/")
    assert res_list.status_code == status.HTTP_200_OK
    assert len(res_list.data["results"]) >= 1

