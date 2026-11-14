from apps.usuarios.constants import (
    NOMBRE_ADMINISTRADOR,
    NOMBRE_AGENTE,
    NOMBRE_CLIENTE,
)
from apps.usuarios.permissions import rol_de

ROL_ANONIMO = "anonimo"

INTENCIONES_CLIENTE = frozenset(
    {
        "saludo",
        "despedida",
        "ayuda",
        "consultar_paquetes",
        "consultar_destinos",
        "consultar_precios",
        "consultar_disponibilidad",
        "consultar_incluye",
        "consultar_duracion",
        "consultar_requisitos",
        "consultar_politicas",
        "consultar_formas_pago",
        "consultar_tipo_cambio",
        "recomendar_destino",
        "comparar_paquetes",
        "solicitar_promociones",
        "hablar_con_agente",
        "iniciar_reserva",
        "estado_reserva",
        "cancelar_reserva",
        "modificar_reserva",
        "fallback",
    }
)

INTENCIONES_INTERNAS = frozenset(
    {
        "buscar_reserva",
        "consultar_cupos",
        "registrar_pago",
        "resumen_ventas",
        "reporte_ocupacion",
    }
)

INTENCIONES_ACCION = frozenset(
    {
        "iniciar_reserva",
        "cancelar_reserva",
        "modificar_reserva",
        "registrar_pago",
    }
)

INTENCIONES_REQUIEREN_AUTENTICACION = frozenset(
    {"estado_reserva"} | INTENCIONES_ACCION | INTENCIONES_INTERNAS
)

INTENCIONES_REQUIEREN_CONFIRMACION = frozenset(
    {
        "cancelar_reserva",
        "modificar_reserva",
        "registrar_pago",
    }
)

INTENCIONES_ANONIMO = INTENCIONES_CLIENTE - INTENCIONES_REQUIEREN_AUTENTICACION
INTENCIONES_AGENTE = INTENCIONES_CLIENTE | frozenset(
    {"buscar_reserva", "consultar_cupos", "registrar_pago"}
)
INTENCIONES_ADMINISTRADOR = INTENCIONES_AGENTE | frozenset(
    {"resumen_ventas", "reporte_ocupacion"}
)

INTENCIONES_POR_ROL = {
    ROL_ANONIMO: INTENCIONES_ANONIMO,
    NOMBRE_CLIENTE: INTENCIONES_CLIENTE,
    NOMBRE_AGENTE: INTENCIONES_AGENTE,
    NOMBRE_ADMINISTRADOR: INTENCIONES_ADMINISTRADOR,
}

def normalizar_rol(rol: str | None) -> str:
    return rol if rol in INTENCIONES_POR_ROL else ROL_ANONIMO

def rol_para_permisos(usuario) -> str:
    return rol_de(usuario) or ROL_ANONIMO

def intenciones_permitidas(rol: str | None) -> frozenset[str]:
    return INTENCIONES_POR_ROL[normalizar_rol(rol)]

def puede_usar_intencion(usuario_o_rol, nombre_intencion: str) -> bool:
    rol = (
        usuario_o_rol
        if isinstance(usuario_o_rol, str)
        else rol_para_permisos(usuario_o_rol)
    )
    return nombre_intencion in intenciones_permitidas(rol)

def requiere_autenticacion(nombre_intencion: str) -> bool:
    return nombre_intencion in INTENCIONES_REQUIEREN_AUTENTICACION

def requiere_confirmacion(nombre_intencion: str) -> bool:
    return nombre_intencion in INTENCIONES_REQUIEREN_CONFIRMACION

def es_intencion_de_accion(nombre_intencion: str) -> bool:
    return nombre_intencion in INTENCIONES_ACCION

def es_intencion_interna(nombre_intencion: str) -> bool:
    return nombre_intencion in INTENCIONES_INTERNAS
