"""Tests completos para el módulo de reservas (CU7) e itinerarios/notificaciones (CU8)."""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Paquete, PaqueteSalida
from apps.reservas.models import Notificacion, Reserva
from apps.reservas.services.itinerarios import obtener_itinerario_por_reserva
from apps.reservas.services.reservas import (
    cancelar_reserva,
    crear_reserva,
    generar_codigo_reserva,
    obtener_reserva,
)
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Cliente, Rol, Usuario

ROL_AGENTE = 2


@pytest.fixture
def setup_reservas(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(email="admin_res@test.bo", password="Password123", rol_id=ROL_ADMINISTRADOR)
    user_cli = Usuario.objects.create_user(email="viajero_res@test.bo", password="Password123", rol_id=ROL_CLIENTE)

    cliente = Cliente.objects.create(
        usuario=user_cli,
        nombres="Valeria",
        apellidos="Mendoza",
        documento_tipo="CI",
        documento_numero="6849201",
        telefono="77234567",
    )

    destino = Destino.objects.create(nombre="Lago Titicaca", pais="Bolivia", region="america_del_sur")
    destino.itinerario.create(numero_dia=1, titulo="Pernocte en Isla del Sol", descripcion="Caminata hacia la Fuente del Inca.")
    destino.itinerario.create(numero_dia=2, titulo="Copacabana y Templos", descripcion="Visita a la basílica y regreso.")

    paquete = Paquete.objects.create(
        destino=destino,
        nombre="Travesía Sagrada del Titicaca",
        duracion_dias=2,
        precio_base=Decimal("200.00"),
        moneda="USD",
    )

    salida = PaqueteSalida.objects.create(
        paquete=paquete,
        fecha_salida=date.today() + timedelta(days=15),
        cupos_totales=10,
        cupos_disponibles=10,
    )

    return {
        "admin": admin,
        "user_cli": user_cli,
        "cliente": cliente,
        "salida": salida,
        "paquete": paquete,
    }


@pytest.mark.django_db
def test_codigo_reserva_formato():
    codigo = generar_codigo_reserva()
    assert codigo.startswith(f"RES-{date.today().year}-")
    assert len(codigo) == 15  # RES-YYYY-XXXXXX


@pytest.mark.django_db
def test_crear_reserva_descuento_cupos_e_itinerario_automatico(setup_reservas):
    d = setup_reservas
    pasajeros = [
        {"nombres": "Valeria", "apellidos": "Mendoza", "documento_tipo": "CI", "documento_numero": "6849201"},
        {"nombres": "Carlos", "apellidos": "Rojas", "documento_tipo": "CI", "documento_numero": "4920192"},
    ]

    reserva = crear_reserva(
        cliente_id=d["cliente"].id,
        salida_id=d["salida"].id,
        num_personas=2,
        pasajeros_datos=pasajeros,
        canal="web",
    )

    assert reserva.id is not None
    assert reserva.estado == Reserva.ESTADO_PENDIENTE
    assert reserva.total == Decimal("400.00")
    assert reserva.num_personas == 2
    assert reserva.pasajeros.count() == 2

    # Verificar que los cupos se descontaron
    d["salida"].refresh_from_db()
    assert d["salida"].cupos_disponibles == 8

    # Verificar CU8: Itinerario generado automáticamente
    itinerario = obtener_itinerario_por_reserva(reserva.id)
    assert itinerario is not None
    assert itinerario.items.count() >= 2

    # Verificar CU8: Notificación registrada
    notif = Notificacion.objects.filter(reserva=reserva).first()
    assert notif is not None
    assert notif.tipo == Notificacion.TIPO_CONFIRMACION


@pytest.mark.django_db
def test_prevencion_sobreventa_cupos_insuficientes(setup_reservas):
    d = setup_reservas
    pasajeros = [{"nombres": f"Viajero {i}", "apellidos": "Test"} for i in range(12)]

    with pytest.raises(ValidationError):
        crear_reserva(
            cliente_id=d["cliente"].id,
            salida_id=d["salida"].id,
            num_personas=12,  # Salida solo tiene 10 cupos
            pasajeros_datos=pasajeros,
        )

    # Los cupos deben mantenerse intactos
    d["salida"].refresh_from_db()
    assert d["salida"].cupos_disponibles == 10


@pytest.mark.django_db
def test_cancelar_reserva_reversion_cupos(setup_reservas):
    d = setup_reservas
    pasajeros = [{"nombres": "Pasajero", "apellidos": "Uno"}]
    reserva = crear_reserva(
        cliente_id=d["cliente"].id,
        salida_id=d["salida"].id,
        num_personas=1,
        pasajeros_datos=pasajeros,
    )
    d["salida"].refresh_from_db()
    assert d["salida"].cupos_disponibles == 9

    # Cancelar reserva
    cancelar_reserva(reserva.id)
    reserva.refresh_from_db()
    assert reserva.estado == Reserva.ESTADO_CANCELADA

    # Los cupos deben ser reintegrados
    d["salida"].refresh_from_db()
    assert d["salida"].cupos_disponibles == 10


@pytest.mark.django_db
def test_api_reservas_creacion_y_permisos(setup_reservas):
    d = setup_reservas
    client = APIClient()
    client.force_authenticate(user=d["user_cli"])

    payload = {
        "salida_id": d["salida"].id,
        "num_personas": 1,
        "canal": "web",
        "pasajeros": [
            {
                "nombres": "Valeria",
                "apellidos": "Mendoza",
                "documento_tipo": "CI",
                "documento_numero": "6849201",
            }
        ],
    }

    res = client.post("/api/v1/reservas/", payload, format="json")
    assert res.status_code == status.HTTP_201_CREATED
    assert res.data["codigo"].startswith("RES-")
    assert res.data["estado"] == "pendiente"

    # Listado por cliente: ve su reserva
    res_list = client.get("/api/v1/reservas/")
    assert res_list.status_code == status.HTTP_200_OK
    assert len(res_list.data["results"]) == 1
