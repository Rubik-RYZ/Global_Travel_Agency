"""Tests para el módulo de hoteles y habitaciones (CU5)."""
from decimal import Decimal
import pytest
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Habitacion, Hotel, Proveedor
from apps.catalogo.services.hoteles import (
    crear_habitacion,
    crear_hotel,
    eliminar_hotel,
    listar_hoteles,
)
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Rol, Usuario

ROL_AGENTE = 2


@pytest.fixture
def setup_hoteles(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(email="admin_hotel@test.bo", password="Password123", rol_id=ROL_ADMINISTRADOR)
    cliente = Usuario.objects.create_user(email="cli_hotel@test.bo", password="Password123", rol_id=ROL_CLIENTE)

    destino = Destino.objects.create(nombre="Cusco Colonial", pais="Perú", region="america_del_sur")
    prov_hotel = Proveedor.objects.create(
        nombre="Cadena Hotelera Andina", tipo="hotel", pais="Perú", ciudad="Cusco"
    )
    prov_otro = Proveedor.objects.create(
        nombre="Transporte Cusco", tipo="transporte", pais="Perú", ciudad="Cusco"
    )

    return {
        "admin": admin,
        "cliente": cliente,
        "destino": destino,
        "prov_hotel": prov_hotel,
        "prov_otro": prov_otro,
    }


@pytest.mark.django_db
def test_creacion_hotel_y_habitacion_exitoso(setup_hoteles):
    d = setup_hoteles
    hotel = crear_hotel(
        proveedor_id=d["prov_hotel"].id,
        destino_id=d["destino"].id,
        nombre="Hotel Monasterio Boutique",
        estrellas=5,
        direccion="Calle Palacios 136",
        descripcion="Hospedaje histórico en Cusco",
    )
    assert hotel.id is not None
    assert hotel.estrellas == 5

    hab = crear_habitacion(
        hotel_id=hotel.id,
        tipo="Suite Imperial",
        capacidad=2,
        precio_noche=Decimal("220.00"),
        moneda="USD",
    )
    assert hab.id is not None
    assert hab.capacidad == 2
    assert hab.hotel == hotel


@pytest.mark.django_db
def test_validacion_hotel_proveedor_no_hotel(setup_hoteles):
    d = setup_hoteles
    with pytest.raises(ValidationError):
        crear_hotel(
            proveedor_id=d["prov_otro"].id,  # es tipo 'transporte'
            destino_id=d["destino"].id,
            nombre="Hotel Inválido",
            estrellas=3,
        )


@pytest.mark.django_db
def test_validacion_hotel_estrellas_fuera_rango(setup_hoteles):
    d = setup_hoteles
    with pytest.raises(ValidationError):
        crear_hotel(
            proveedor_id=d["prov_hotel"].id,
            destino_id=d["destino"].id,
            nombre="Hotel Seis Estrellas",
            estrellas=6,
        )


@pytest.mark.django_db
def test_api_hoteles_y_habitaciones_crud(setup_hoteles):
    d = setup_hoteles
    client_admin = APIClient()
    client_admin.force_authenticate(user=d["admin"])

    payload_hotel = {
        "proveedor_id": d["prov_hotel"].id,
        "destino_id": d["destino"].id,
        "nombre": "Palacio Inka Test",
        "estrellas": 4,
        "direccion": "Plazoleta Santo Domingo",
        "activo": True,
    }

    res_h = client_admin.post("/api/v1/hoteles/", payload_hotel, format="json")
    assert res_h.status_code == status.HTTP_201_CREATED
    hotel_id = res_h.data["id"]

    payload_hab = {
        "hotel_id": hotel_id,
        "tipo": "Doble Superior",
        "capacidad": 2,
        "precio_noche": "140.00",
        "moneda": "USD",
    }
    res_hab = client_admin.post("/api/v1/habitaciones/", payload_hab, format="json")
    assert res_hab.status_code == status.HTTP_201_CREATED

    # Listado
    res_list = client_admin.get(f"/api/v1/habitaciones/?hotel_id={hotel_id}")
    assert res_list.status_code == status.HTTP_200_OK
    assert len(res_list.data["results"]) == 1

