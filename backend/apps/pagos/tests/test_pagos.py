from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Paquete, PaqueteSalida
from apps.pagos.models import Pago
from apps.reservas.models import Reserva
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Cliente, Rol, Usuario

ROL_AGENTE = 2

@pytest.fixture
def setup_pagos(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(
        email="admin_pagos@test.bo", password="Password123", rol_id=ROL_ADMINISTRADOR
    )
    agente = Usuario.objects.create_user(
        email="agente_pagos@test.bo", password="Password123", rol_id=ROL_AGENTE
    )
    usuario_cliente = Usuario.objects.create_user(
        email="cliente_pagos@test.bo", password="Password123", rol_id=ROL_CLIENTE
    )

    cliente = Cliente.objects.create(
        usuario=usuario_cliente,
        nombres="María",
        apellidos="Condori",
        documento_tipo="CI",
        documento_numero="7845120",
    )
    destino = Destino.objects.create(
        nombre="Valle de la Luna", pais="Bolivia", region="america_del_sur"
    )
    paquete = Paquete.objects.create(
        destino=destino,
        nombre="Valle de la Luna 2D/1N",
        duracion_dias=2,
        precio_base=Decimal("100.00"),
        moneda="USD",
    )
    salida = PaqueteSalida.objects.create(
        paquete=paquete,
        fecha_salida=date.today() + timedelta(days=20),
        cupos_totales=10,
        cupos_disponibles=8,
    )
    reserva = Reserva.objects.create(
        codigo="RES-TEST-900",
        cliente=cliente,
        salida=salida,
        num_personas=2,
        total=Decimal("200.00"),
        moneda="USD",
        estado=Reserva.ESTADO_CONFIRMADA,
        canal=Reserva.CANAL_WEB,
    )
    pago_aprobado = Pago.objects.create(
        reserva=reserva,
        monto=Decimal("100.00"),
        moneda="USD",
        tipo_cambio_a_bob=Decimal("6.960000"),
        monto_bob=Decimal("696.00"),
        metodo="tarjeta",
        estado=Pago.Estado.APROBADO,
    )
    pago_pendiente = Pago.objects.create(
        reserva=reserva,
        monto=Decimal("100.00"),
        moneda="USD",
        tipo_cambio_a_bob=Decimal("6.960000"),
        monto_bob=Decimal("696.00"),
        metodo="transferencia",
        estado=Pago.Estado.PENDIENTE,
    )
    return {
        "admin": admin,
        "agente": agente,
        "cliente": usuario_cliente,
        "reserva": reserva,
        "aprobado": pago_aprobado,
        "pendiente": pago_pendiente,
    }

def _cliente(usuario):
    api = APIClient()
    api.force_authenticate(user=usuario)
    return api

@pytest.mark.django_db
def test_libro_pagos_admin_lista_y_totales(setup_pagos):
    datos = setup_pagos
    respuesta = _cliente(datos["admin"]).get("/api/v1/pagos/")

    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["count"] == 2
    assert respuesta.data["totales"]["total_registros"] == 2
    assert respuesta.data["totales"]["total_bob"] == "1392.00"
    assert respuesta.data["totales"]["aprobado_bob"] == "696.00"
    assert respuesta.data["totales"]["pendiente_bob"] == "696.00"

    fila = respuesta.data["results"][0]
    assert fila["reserva_codigo"] == "RES-TEST-900"
    assert fila["cliente_nombre"] == "María Condori"
    assert fila["paquete_nombre"] == "Valle de la Luna 2D/1N"
    assert fila["destino_nombre"] == "Valle de la Luna"

@pytest.mark.django_db
def test_libro_pagos_agente_puede_consultar(setup_pagos):
    datos = setup_pagos
    respuesta = _cliente(datos["agente"]).get("/api/v1/pagos/")

    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["count"] == 2

@pytest.mark.django_db
def test_libro_pagos_cliente_prohibido(setup_pagos):
    datos = setup_pagos
    respuesta = _cliente(datos["cliente"]).get("/api/v1/pagos/")

    assert respuesta.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_libro_pagos_requiere_autenticacion():
    respuesta = APIClient().get("/api/v1/pagos/")

    assert respuesta.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_libro_pagos_filtra_por_estado_y_busqueda(setup_pagos):
    datos = setup_pagos
    api = _cliente(datos["admin"])

    respuesta = api.get("/api/v1/pagos/", {"estado": "aprobado"})
    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["count"] == 1
    assert respuesta.data["results"][0]["id"] == datos["aprobado"].id

    respuesta = api.get("/api/v1/pagos/", {"q": "7845120"})
    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["count"] == 2

    respuesta = api.get("/api/v1/pagos/", {"estado": "inventado"})
    assert respuesta.status_code == status.HTTP_400_BAD_REQUEST
