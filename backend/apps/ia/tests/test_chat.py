"""Tests del clasificador y del endpoint de chat (CU10)."""
import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.ia.services.clasificador import obtener_clasificador, recargar_clasificador


@pytest.fixture
def catalogo_entrenado(db):
    call_command("cargar_intenciones_ia", verbosity=0)
    recargar_clasificador()
    return obtener_clasificador()


def test_clasificador_reconoce_saludo_y_precio(catalogo_entrenado):
    saludo = catalogo_entrenado.predecir("Hola")
    precio = catalogo_entrenado.predecir("Cuánto cuesta el paquete a Machu Picchu")

    assert saludo.intencion == "saludo"
    assert saludo.confianza >= 0.25
    assert precio.intencion == "consultar_precios"
    assert precio.confianza >= 0.25


def test_clasificador_deriva_textos_fuera_de_alcance(catalogo_entrenado):
    prediccion = catalogo_entrenado.predecir("Cuéntame un chiste")

    assert prediccion.intencion == "fallback"


@pytest.mark.django_db
def test_endpoint_chat_responde_a_anonimo(catalogo_entrenado):
    cliente = APIClient()

    respuesta = cliente.post(
        "/api/v1/ia/chat/",
        {"mensaje": "Hola"},
        format="json",
    )

    assert respuesta.status_code == 200
    assert respuesta.data["intencion"] == "saludo"
    assert respuesta.data["permitida"] is True
    assert respuesta.data["respuesta"]


@pytest.mark.django_db
def test_endpoint_chat_niega_accion_sin_sesion(catalogo_entrenado):
    cliente = APIClient()

    respuesta = cliente.post(
        "/api/v1/ia/chat/",
        {"mensaje": "Quiero reservar dos personas"},
        format="json",
    )

    assert respuesta.status_code == 200
    assert respuesta.data["intencion"] == "iniciar_reserva"
    assert respuesta.data["permitida"] is False
    assert "iniciar sesión" in respuesta.data["respuesta"]


@pytest.mark.django_db
def test_endpoint_chat_rechaza_mensaje_vacio(catalogo_entrenado):
    cliente = APIClient()

    respuesta = cliente.post(
        "/api/v1/ia/chat/",
        {"mensaje": "   "},
        format="json",
    )

    assert respuesta.status_code == 400
