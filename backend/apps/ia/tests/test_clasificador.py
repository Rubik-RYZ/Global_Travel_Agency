from io import StringIO

import pytest
from django.core.management import call_command

from apps.ia.management.commands.cargar_intenciones_ia import INTENCIONES
from apps.ia.services.clasificador import (
    INTENCION_FALLBACK,
    ClasificadorIntenciones,
    normalizar_texto,
    recargar_clasificador,
)

def test_normalizar_texto_lematiza_plurales_y_verbos():
    assert (
        normalizar_texto("Quiero ver VUELOS y hoteles disponibles")
        == "querer ver vuelo y hotel disponible"
    )

def test_normalizar_texto_lematiza_consultas_frecuentes():
    assert normalizar_texto("¿Cuánto cuesta el paquete?") == "cuánto costar el paquete"
    assert normalizar_texto("Quiero reservar para dos personas") == (
        "querer reservar para dos persona"
    )

def test_normalizar_texto_conserva_codigos_y_numeros():
    assert normalizar_texto("Reserva RES-123") == "reserva res 123"

def test_clasificador_sin_entrenar_devuelve_fallback():
    prediccion = ClasificadorIntenciones().predecir("Hola")
    assert prediccion.intencion == INTENCION_FALLBACK
    assert prediccion.confianza == 0.0

def test_catalogo_ampliado_sin_duplicados():
    assert len(INTENCIONES) == 27
    assert sum(len(datos["frases"]) for datos in INTENCIONES.values()) >= 800
    for nombre, datos in INTENCIONES.items():
        frases = datos["frases"]
        assert len(frases) == len(set(frases)), f"Frases duplicadas en {nombre}"

@pytest.mark.django_db
def test_clasificador_entrena_y_reconoce_frases_nuevas():
    call_command("cargar_intenciones_ia", stdout=StringIO())
    clasificador = recargar_clasificador()
    assert clasificador.entrenado

    casos = {
        "¿A cuánto está el dólar?": "consultar_tipo_cambio",
        "Quiero cancelar mi reserva": "cancelar_reserva",
        "¿Qué paquetes tienen para diciembre?": "consultar_paquetes",
        "Quiero ver la ocupación por salida": "reporte_ocupacion",
        "¿Puedo pagar con tarjeta?": "consultar_formas_pago",
        "Quiero cambiar la fecha de mi reserva": "modificar_reserva",
        "¿Hay descuentos para grupos?": "solicitar_promociones",
        "¿Qué documentos piden para viajar?": "consultar_requisitos",
        "Quiero que me recomiendes un destino": "recomendar_destino",
    }
    for texto, esperada in casos.items():
        assert clasificador.predecir(texto).intencion == esperada
