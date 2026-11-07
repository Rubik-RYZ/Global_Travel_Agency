"""Flujo de respuesta del asistente conversacional (CU10)."""
from __future__ import annotations

from apps.ia.permissions import (
    INTENCIONES_ADMINISTRADOR,
    ROL_ANONIMO,
    puede_usar_intencion,
    rol_para_permisos,
)
from apps.ia.services.clasificador import obtener_clasificador
from apps.usuarios.constants import NOMBRE_ADMINISTRADOR

RESPUESTAS = {
    "saludo": (
        "Hola, soy el asistente de Illimani. Puedo ayudarte con destinos, "
        "paquetes, precios, disponibilidad y reservas. ¿Qué viaje estás pensando?"
    ),
    "despedida": "Con gusto. Cuando quieras seguir planificando tu viaje, aquí estaré.",
    "ayuda": (
        "Puedo orientarte sobre paquetes, destinos, precios, fechas, requisitos, "
        "formas de pago y reservas. Dime qué necesitas y lo revisamos."
    ),
    "consultar_paquetes": (
        "Puedes explorar los paquetes disponibles en la sección «Paquetes "
        "Turísticos». Cada ficha muestra destinos, duración, precio e itinerario."
    ),
    "consultar_destinos": (
        "Tenemos destinos como Machu Picchu, Costa Amalfitana y Salar de Uyuni. "
        "Puedes ver el catálogo completo en «Expediciones»."
    ),
    "consultar_precios": (
        "El precio de cada paquete aparece en su ficha y en el catálogo. Dime qué "
        "destino te interesa y te oriento para revisar su tarifa vigente."
    ),
    "consultar_disponibilidad": (
        "Las fechas y cupos vigentes se muestran en las salidas programadas de "
        "cada paquete. Indícame el destino y la fecha que te interesa."
    ),
    "consultar_incluye": (
        "Cada paquete detalla qué incluye y qué no incluye en su ficha. Si me "
        "dices el destino, te indico dónde revisar esa información."
    ),
    "consultar_duracion": (
        "La duración en días y noches está indicada en la ficha de cada paquete. "
        "Dime cuál te interesa y lo revisamos."
    ),
    "consultar_requisitos": (
        "Los requisitos dependen del destino y de tu nacionalidad. Revisa la ficha "
        "del viaje o consulta con un agente para confirmar documentos y visas."
    ),
    "consultar_politicas": (
        "Las políticas de cancelación, cambios y devolución están en las "
        "condiciones de cada paquete. Puedo ayudarte a ubicarlas si me indicas el viaje."
    ),
    "consultar_formas_pago": (
        "Los medios de pago disponibles están publicados en el sitio. Para pagar "
        "una reserva, ingresa a «Mi viaje» o solicita apoyo a un agente."
    ),
    "consultar_tipo_cambio": (
        "La cotización vigente se muestra en el sitio al momento del pago. Si "
        "necesitas convertir un monto, dime la moneda y el importe."
    ),
    "recomendar_destino": (
        "Puedo recomendarte según tu estilo de viaje. Cuéntame si buscas cultura, "
        "naturaleza, gastronomía, playa o aventura, y cuántos días tienes."
    ),
    "comparar_paquetes": (
        "Puedo comparar dos paquetes por duración, precio, destino y servicios "
        "incluidos. Dime cuáles tienes en mente."
    ),
    "solicitar_promociones": (
        "Las promociones vigentes se muestran en el catálogo y en las fichas de "
        "cada paquete. Dime qué destino te interesa y revisamos sus opciones."
    ),
    "hablar_con_agente": (
        "Puedo derivarte con un agente de la agencia. Déjame tus datos de contacto "
        "y el motivo de tu consulta para que te atiendan."
    ),
    "iniciar_reserva": (
        "Para iniciar una reserva, abre la ficha del paquete y elige la salida. "
        "Si prefieres, un agente puede acompañarte en el proceso."
    ),
    "estado_reserva": (
        "Puedes consultar el estado de tu reserva en «Mi viaje». Ten a mano tu "
        "código de reserva para ubicarla."
    ),
    "cancelar_reserva": (
        "Para cancelar una reserva, ingresa a «Mi viaje» o solicita atención con "
        "un agente. Antes de confirmar, revisa las condiciones del paquete."
    ),
    "modificar_reserva": (
        "Los cambios de fecha o pasajeros se gestionan desde «Mi viaje» o con un "
        "agente. Revisa las condiciones del paquete antes de confirmar."
    ),
    "fallback": (
        "No estoy seguro de haber entendido. Puedo ayudarte con paquetes, destinos, "
        "precios, disponibilidad, requisitos, pagos y reservas. ¿Puedes reformularlo?"
    ),
    "buscar_reserva": (
        "Puedo buscar una reserva por código, cliente o documento. Indícame el "
        "criterio y el dato exacto para localizarla."
    ),
    "consultar_cupos": (
        "Indícame el paquete y la fecha de salida para revisar los cupos "
        "disponibles y el aforo de esa salida."
    ),
    "registrar_pago": (
        "Para registrar un pago, abre la reserva correspondiente y confirma el "
        "método y el monto antes de guardar la operación."
    ),
    "resumen_ventas": (
        "El resumen de ventas está disponible en «Reportes gerenciales», con "
        "filtros por fecha, canal y agrupación."
    ),
    "reporte_ocupacion": (
        "El reporte de ocupación está en «Reportes gerenciales». Puedes revisar "
        "cupos vendidos y disponibilidad por paquete o salida."
    ),
}


def _respuesta_denegada(usuario, intencion: str) -> str:
    rol = rol_para_permisos(usuario)
    if rol == ROL_ANONIMO:
        return (
            "Para consultar tus reservas o realizar esa acción necesitas iniciar "
            "sesión. También puedes pedir atención con un agente."
        )
    if intencion in INTENCIONES_ADMINISTRADOR and rol != NOMBRE_ADMINISTRADOR:
        return "Esa consulta está reservada al administrador de la agencia."
    return (
        "Tu rol no tiene permiso para esa función. Puedo ayudarte con información "
        "de viajes, paquetes y disponibilidad."
    )


def procesar_mensaje(usuario, texto: str) -> dict:
    """Clasifica el mensaje, valida el rol y devuelve la respuesta."""
    prediccion = obtener_clasificador().predecir(texto)
    permitida = puede_usar_intencion(usuario, prediccion.intencion)

    if permitida:
        respuesta = RESPUESTAS.get(prediccion.intencion, RESPUESTAS["fallback"])
    else:
        respuesta = _respuesta_denegada(usuario, prediccion.intencion)

    return {
        "respuesta": respuesta,
        "intencion": prediccion.intencion,
        "confianza": prediccion.confianza,
        "permitida": permitida,
    }
