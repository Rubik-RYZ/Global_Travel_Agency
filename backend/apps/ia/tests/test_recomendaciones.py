from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.catalogo.models import Destino, Paquete, PaqueteSalida
from apps.ia.models import ModeloIA, Recomendacion
from apps.ia.services import recomendaciones as svc
from apps.reservas.models import Reserva
from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Cliente, ClientePreferencia, Rol, Usuario

@pytest.fixture
def base(db):
    Rol.objects.get_or_create(
        id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"}
    )
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})

    admin = Usuario.objects.create_user(
        email="admin_cu11@test.bo",
        password="Password123",
        rol_id=ROL_ADMINISTRADOR,
    )
    usuario = Usuario.objects.create_user(
        email="viajero_cu11@test.bo",
        password="Password123",
        rol_id=ROL_CLIENTE,
    )
    cliente = Cliente.objects.create(
        usuario=usuario, nombres="Ana", apellidos="Quispe"
    )

    destino_playa = Destino.objects.create(
        nombre="Cancún",
        pais="México",
        region="america_del_norte",
        caracter="descanso",
        etiquetas=["playa", "romantico"],
    )
    destino_cultural = Destino.objects.create(
        nombre="Cusco",
        pais="Perú",
        region="america_del_sur",
        caracter="cultural",
        etiquetas=["cultural", "historico"],
    )

    playa = Paquete.objects.create(
        destino=destino_playa,
        nombre="Escapada Caribe",
        duracion_dias=5,
        precio_base=Decimal("800.00"),
        moneda="USD",
        etiquetas=["playa", "romantico"],
    )
    playa_2 = Paquete.objects.create(
        destino=destino_playa,
        nombre="Riviera Maya",
        duracion_dias=6,
        precio_base=Decimal("900.00"),
        moneda="USD",
        etiquetas=["playa", "romantico"],
    )
    cultural = Paquete.objects.create(
        destino=destino_cultural,
        nombre="Ruta Inca",
        duracion_dias=7,
        precio_base=Decimal("1200.00"),
        moneda="USD",
        etiquetas=["cultural", "historico"],
    )

    salidas = {}
    for paquete in (playa, playa_2, cultural):
        salidas[paquete.id] = PaqueteSalida.objects.create(
            paquete=paquete,
            fecha_salida=date.today() + timedelta(days=20),
            cupos_totales=10,
            cupos_disponibles=10,
        )

    return {
        "admin": admin,
        "usuario": usuario,
        "cliente": cliente,
        "playa": playa,
        "playa_2": playa_2,
        "cultural": cultural,
        "salidas": salidas,
    }

def _reservar(cliente, salida, codigo, estado=Reserva.ESTADO_CONFIRMADA):
    return Reserva.objects.create(
        codigo=codigo,
        cliente=cliente,
        salida=salida,
        num_personas=1,
        estado=estado,
        total=Decimal("800.00"),
        moneda="USD",
    )

@pytest.mark.django_db
def test_entrenar_crea_version_y_desactiva_anteriores(base):
    primera = svc.entrenar_recomendador()
    segunda = svc.entrenar_recomendador()

    primera.refresh_from_db()
    assert primera.activo is False
    assert segunda.activo is True
    assert segunda.tipo == ModeloIA.TIPO_RECOMENDADOR
    assert segunda.metricas["algoritmo"] == svc.ALGORITMO
    assert segunda.metricas["pesos"]["historial"] == pytest.approx(0.25)
    assert svc.obtener_modelo_activo().id == segunda.id

@pytest.mark.django_db
def test_activar_modelo_deja_uno_solo_activo(base):
    primera = svc.entrenar_recomendador()
    segunda = svc.entrenar_recomendador()

    svc.activar_modelo(primera)

    primera.refresh_from_db()
    segunda.refresh_from_db()
    assert primera.activo is True
    assert segunda.activo is False

@pytest.mark.django_db
def test_prioriza_intereses_y_presupuesto(base):
    ClientePreferencia.objects.create(
        cliente=base["cliente"],
        presupuesto_max=Decimal("1000.00"),
        moneda="USD",
        intereses=["playa"],
    )

    recomendaciones = svc.generar_recomendaciones(base["cliente"])

    assert recomendaciones
    assert recomendaciones[0].paquete_id == base["playa"].id
    assert len({recomendacion.lote for recomendacion in recomendaciones}) == 1

@pytest.mark.django_db
def test_historial_impulsa_destino_ya_reservado(base):
    _reservar(
        base["cliente"],
        base["salidas"][base["playa"].id],
        "RES-TEST-0001",
    )

    recomendaciones = svc.generar_recomendaciones(base["cliente"])
    ids = [recomendacion.paquete_id for recomendacion in recomendaciones]

    assert base["playa"].id not in ids
    assert ids[0] == base["playa_2"].id
    assert svc.tiene_historial(base["cliente"]) is True

@pytest.mark.django_db
def test_reserva_cancelada_no_excluye_ni_aporta_historial(base):
    _reservar(
        base["cliente"],
        base["salidas"][base["cultural"].id],
        "RES-TEST-0002",
        estado=Reserva.ESTADO_CANCELADA,
    )

    recomendaciones = svc.generar_recomendaciones(base["cliente"])
    ids = [recomendacion.paquete_id for recomendacion in recomendaciones]

    assert base["cultural"].id in ids
    assert svc.tiene_historial(base["cliente"]) is False

@pytest.mark.django_db
def test_lote_conserva_historial_y_se_renueva_al_forzar(base):
    primera = svc.generar_recomendaciones(base["cliente"])
    total_inicial = Recomendacion.objects.filter(
        cliente=base["cliente"]
    ).count()
    lote_inicial = primera[0].lote

    repetida = svc.generar_recomendaciones(base["cliente"])
    assert {recomendacion.lote for recomendacion in repetida} == {lote_inicial}
    assert (
        Recomendacion.objects.filter(cliente=base["cliente"]).count()
        == total_inicial
    )

    renovada = svc.generar_recomendaciones(base["cliente"], forzar=True)
    assert {recomendacion.lote for recomendacion in renovada} != {lote_inicial}
    assert (
        Recomendacion.objects.filter(cliente=base["cliente"]).count()
        == total_inicial * 2
    )

@pytest.mark.django_db
def test_aceptar_solo_propia_e_idempotente(base):
    recomendaciones = svc.generar_recomendaciones(base["cliente"])
    elegida = recomendaciones[0]

    aceptada = svc.aceptar_recomendacion(base["cliente"], elegida.id)
    aceptada_2 = svc.aceptar_recomendacion(base["cliente"], elegida.id)

    assert aceptada.aceptada is True
    assert aceptada.mostrada is True
    assert aceptada_2.id == aceptada.id
    assert (
        Recomendacion.objects.filter(
            cliente=base["cliente"], aceptada=True
        ).count()
        == 1
    )

    otro_usuario = Usuario.objects.create_user(
        email="otro_cu11@test.bo",
        password="Password123",
        rol_id=ROL_CLIENTE,
    )
    otro_cliente = Cliente.objects.create(
        usuario=otro_usuario, nombres="Luis", apellidos="Rojas"
    )

    with pytest.raises(ValidationError):
        svc.aceptar_recomendacion(otro_cliente, elegida.id)

@pytest.mark.django_db
def test_api_recomendaciones_incluye_usa_historial(base):
    client = APIClient()
    client.force_authenticate(user=base["usuario"])

    respuesta = client.get("/api/v1/ia/recomendaciones/")
    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["usa_historial"] is False

    _reservar(
        base["cliente"],
        base["salidas"][base["playa"].id],
        "RES-TEST-0003",
    )

    respuesta = client.get("/api/v1/ia/recomendaciones/?forzar=true")
    assert respuesta.status_code == status.HTTP_200_OK
    assert respuesta.data["usa_historial"] is True
    assert len(respuesta.data["recomendaciones"]) >= 1

@pytest.mark.django_db
def test_api_entrenar_y_activar_exige_administrador(base):
    admin_client = APIClient()
    admin_client.force_authenticate(user=base["admin"])

    entrenada = admin_client.post(
        "/api/v1/ia/admin/recomendador/entrenar/"
    )
    assert entrenada.status_code == status.HTTP_200_OK
    assert entrenada.data["modelo_activo"]["activo"] is True
    assert len(entrenada.data["modelos"]) == 1
    primera_id = entrenada.data["modelo_activo"]["id"]

    segunda = admin_client.post(
        "/api/v1/ia/admin/recomendador/entrenar/"
    )
    assert segunda.status_code == status.HTTP_200_OK

    activada = admin_client.post(
        f"/api/v1/ia/admin/recomendador/modelos/{primera_id}/activar/"
    )
    assert activada.status_code == status.HTTP_200_OK
    assert activada.data["modelo_activo"]["id"] == primera_id

    cliente_client = APIClient()
    cliente_client.force_authenticate(user=base["usuario"])
    denegado = cliente_client.post(
        "/api/v1/ia/admin/recomendador/entrenar/"
    )
    assert denegado.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_api_panel_admin_expone_historial_y_versiones(base):
    admin_client = APIClient()
    admin_client.force_authenticate(user=base["admin"])
    svc.generar_recomendaciones(base["cliente"])

    respuesta = admin_client.get("/api/v1/ia/admin/recomendaciones/")

    assert respuesta.status_code == status.HTTP_200_OK
    assert "modelo_activo" in respuesta.data
    assert "modelos" in respuesta.data
    assert "historial" in respuesta.data
    assert respuesta.data["historial"]["paquetes_activos"] == 3
