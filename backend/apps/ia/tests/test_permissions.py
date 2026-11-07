"""Tests de permisos, prompts y catálogo inicial del chatbot (CU10)."""
import pytest
from django.core.management import call_command

from apps.ia.management.commands.cargar_intenciones_ia import INTENCIONES
from apps.ia.models import FraseEntrenamiento, Intencion
from apps.ia.permissions import (
    INTENCIONES_ADMINISTRADOR,
    INTENCIONES_AGENTE,
    INTENCIONES_ANONIMO,
    INTENCIONES_CLIENTE,
    INTENCIONES_REQUIEREN_AUTENTICACION,
    INTENCIONES_REQUIEREN_CONFIRMACION,
    puede_usar_intencion,
)
from apps.ia.prompts import prompt_para_rol


def test_anonimo_no_puede_reservar_ni_consultar_reservas():
    assert not puede_usar_intencion("anonimo", "iniciar_reserva")
    assert not puede_usar_intencion("anonimo", "estado_reserva")
    assert puede_usar_intencion("anonimo", "consultar_precios")


def test_cliente_puede_gestionar_sus_reservas():
    assert puede_usar_intencion("cliente", "estado_reserva")
    assert puede_usar_intencion("cliente", "cancelar_reserva")
    assert not puede_usar_intencion("cliente", "buscar_reserva")


def test_agente_y_administrador_heredan_permisos():
    assert INTENCIONES_CLIENTE < INTENCIONES_AGENTE
    assert INTENCIONES_AGENTE < INTENCIONES_ADMINISTRADOR
    assert puede_usar_intencion("agente", "registrar_pago")
    assert not puede_usar_intencion("agente", "resumen_ventas")
    assert puede_usar_intencion("administrador", "reporte_ocupacion")


def test_acciones_sensibles_requieren_confirmacion():
    assert "cancelar_reserva" in INTENCIONES_REQUIEREN_CONFIRMACION
    assert "modificar_reserva" in INTENCIONES_REQUIEREN_CONFIRMACION
    assert "registrar_pago" in INTENCIONES_REQUIEREN_CONFIRMACION
    assert "consultar_precios" not in INTENCIONES_REQUIEREN_CONFIRMACION


def test_intenciones_autenticadas_no_estan_en_anonimo():
    assert not (INTENCIONES_ANONIMO & INTENCIONES_REQUIEREN_AUTENTICACION)


def test_prompt_cambia_por_rol():
    anonimo = prompt_para_rol("anonimo")
    administrador = prompt_para_rol("administrador")
    assert anonimo != administrador
    assert "no inició sesión" in anonimo
    assert "reporte_ocupacion" in administrador


@pytest.mark.django_db
def test_comando_carga_catalogo_idempotente():
    total_frases = sum(len(datos["frases"]) for datos in INTENCIONES.values())

    call_command("cargar_intenciones_ia", verbosity=0)
    assert Intencion.objects.count() == 27
    assert FraseEntrenamiento.objects.count() == total_frases

    call_command("cargar_intenciones_ia", verbosity=0)
    assert Intencion.objects.count() == 27
    assert FraseEntrenamiento.objects.count() == total_frases
