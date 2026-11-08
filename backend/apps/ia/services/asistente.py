"""Respuestas con datos reales y acciones seguras del asistente (CU10).

La clasificación decide la intención, pero la respuesta y cualquier efecto se
construyen aquí consultando la base de datos y validando de nuevo el rol. Las
acciones destructivas o con costo quedan pendientes de confirmación explícita.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.utils import timezone

from apps.catalogo.models import Destino, Paquete, PaqueteSalida
from apps.ia.permissions import (
    ROL_ANONIMO,
    puede_usar_intencion,
    rol_para_permisos,
)
from apps.pagos.models import TipoCambio
from apps.pagos.services.pagos import registrar_pago, saldo_pendiente, total_pagado
from apps.reservas.models import Reserva
from apps.reservas.services.reservas import (
    cancelar_reserva,
    crear_reserva,
    modificar_salida_reserva,
)
from apps.reportes.services.reportes import reporte_ocupacion, resumen_ventas
from apps.usuarios.constants import (
    NOMBRE_ADMINISTRADOR,
    NOMBRE_AGENTE,
    NOMBRE_CLIENTE,
)

STOPWORDS = {
    "para",
    "con",
    "por",
    "del",
    "las",
    "los",
    "una",
    "uno",
    "unos",
    "unas",
    "que",
    "como",
    "donde",
    "cuando",
    "quiero",
    "quisiera",
    "necesito",
    "busco",
    "viajar",
    "viaje",
    "paquete",
    "paquetes",
    "reserva",
    "reservas",
    "reservar",
    "cancelar",
    "modificar",
    "consultar",
    "informacion",
    "sobre",
    "tiene",
    "tienen",
    "hay",
    "precio",
    "precios",
    "disponibilidad",
    "fecha",
    "fechas",
}

AFIRMATIVOS = {
    "si",
    "sí",
    "confirmo",
    "confirmar",
    "confirmado",
    "dale",
    "de acuerdo",
    "adelante",
    "ok",
    "okay",
    "correcto",
    "procede",
    "hazlo",
}

NEGATIVOS = {
    "no",
    "no gracias",
    "mejor no",
    "cancela",
    "cancelar",
    "detente",
    "olvidalo",
    "olvídalo",
}


def _normalizar(texto: str | None) -> str:
    base = unicodedata.normalize("NFKD", (texto or "").lower())
    return "".join(caracter for caracter in base if not unicodedata.combining(caracter))


def _limpio(texto: str | None) -> str:
    return re.sub(r"\s+", " ", (texto or "").strip())


def _es_afirmativo(texto: str) -> bool:
    return _normalizar(_limpio(texto)) in {_normalizar(item) for item in AFIRMATIVOS}


def _es_negativo(texto: str) -> bool:
    return _normalizar(_limpio(texto)) in {_normalizar(item) for item in NEGATIVOS}


def _dinero(valor, moneda: str) -> str:
    return f"{moneda} {Decimal(valor):,.2f}"


def _fecha(valor: date | datetime) -> str:
    return valor.strftime("%d/%m/%Y")


def clasificar_por_palabras(texto: str) -> str | None:
    """Refuerza intenciones críticas cuando el modelo duda con frases nuevas."""
    normalizado = _normalizar(texto)
    codigo = _extraer_codigo(texto)

    reglas = (
        ("consultar_politicas", r"\bpoliticas?\b"),
        ("cancelar_reserva", r"\b(cancelar|anular|anula)\b.*\breserva\b|\breserva\b.*\b(cancelar|anular)\b"),
        ("modificar_reserva", r"\b(modificar|cambiar|mover)\b.*\b(reserva|fecha|salida)\b"),
        ("registrar_pago", r"\b(registrar|cobrar|ingresar)\b.*\bpago\b|\babono\b|\badelanto\b"),
        ("buscar_reserva", r"\bbuscar\b.*\breserva\b|\breserva\b.*\b(documento|cliente)\b"),
        ("resumen_ventas", r"\bresumen\b.*\bventas?\b|\bventas?\b.*\b(mes|periodo|ingresos)\b|\bingresos\b|\bticket promedio\b"),
        ("reporte_ocupacion", r"\bocupacion\b|\baforo\b|\bcupos vendidos\b"),
        ("consultar_cupos", r"\bcupos?\b|\bdisponibilidad\b.*\bcupos?\b"),
        ("estado_reserva", r"\bmi reserva\b|\bmis reservas\b|\bestado\b.*\breserva\b|\breserva\b.*\bestado\b"),
        ("iniciar_reserva", r"\biniciar\b.*\breserva\b|\bquiero reservar\b|\breservar\b"),
        ("consultar_tipo_cambio", r"\btipo de cambio\b|\bcotizacion\b"),
        ("consultar_formas_pago", r"\bformas? de pago\b|\bmedios? de pago\b|\bcomo pagar\b"),
        ("solicitar_promociones", r"\bpromocion(es)?\b|\bofertas?\b|\bdescuentos?\b"),
        ("comparar_paquetes", r"\bcomparar\b"),
        ("consultar_incluye", r"\bincluye\b|\bque incluye\b"),
        ("consultar_duracion", r"\bduracion\b|\bcuantos dias\b"),
        ("consultar_requisitos", r"\brequisitos?\b|\bvisas?\b|\bdocumentos?\b"),
        ("consultar_precios", r"\bprecios?\b|\bcuanto cuesta\b|\btarifas?\b"),
        ("consultar_destinos", r"\bdestinos?\b"),
        ("consultar_paquetes", r"\bpaquetes?\b"),
        ("recomendar_destino", r"\brecomiend(a|e|en|as)?\b|\brecomendacion(es)?\b"),
        ("hablar_con_agente", r"\bagente\b|\bhumano\b|\bpersona real\b"),
        ("ayuda", r"\bayuda\b|\bque puedes hacer\b"),
        ("despedida", r"\b(adios|chao|hasta luego|nos vemos)\b"),
        ("saludo", r"^\s*(hola|buenos dias|buenas tardes|buenas noches|hey)\b"),
    )
    for intencion, patron in reglas:
        if re.search(patron, normalizado):
            return intencion
    if codigo:
        return "estado_reserva"
    return None


def _tokens(texto: str | None) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9]{3,}", _normalizar(texto))
        if token not in STOPWORDS
    ]


def _puntaje_nombre(nombre: str | None, texto: str) -> int:
    nombre_normalizado = _normalizar(nombre)
    if not nombre_normalizado:
        return 0
    if nombre_normalizado in _normalizar(texto):
        return 100 + len(nombre_normalizado)
    return sum(1 for token in _tokens(nombre) if token in _normalizar(texto))


def _paquetes() -> list[Paquete]:
    return list(
        Paquete.objects.filter(activo=True, destino__activo=True)
        .select_related("destino", "hotel")
        .prefetch_related("salidas")
        .order_by("nombre")
    )


def _mejor_paquete(texto: str, paquetes: list[Paquete] | None = None) -> Paquete | None:
    candidatos = paquetes if paquetes is not None else _paquetes()
    mejor = None
    mejor_puntaje = 0
    for paquete in candidatos:
        puntaje = max(
            _puntaje_nombre(paquete.nombre, texto),
            _puntaje_nombre(paquete.destino.nombre, texto),
            _puntaje_nombre(paquete.destino.pais, texto),
        )
        if puntaje > mejor_puntaje:
            mejor = paquete
            mejor_puntaje = puntaje
    return mejor


def _destinos() -> list[Destino]:
    return list(Destino.objects.filter(activo=True).order_by("nombre"))


def _salidas_futuras(paquete_id: int | None = None) -> list[PaqueteSalida]:
    hoy = timezone.localdate()
    qs = (
        PaqueteSalida.objects.filter(
            fecha_salida__gte=hoy,
            cupos_disponibles__gt=0,
            paquete__activo=True,
            paquete__destino__activo=True,
        )
        .select_related("paquete", "paquete__destino")
        .order_by("fecha_salida", "paquete__nombre")
    )
    if paquete_id:
        qs = qs.filter(paquete_id=paquete_id)
    return list(qs)


def _proximas_salidas(paquete: Paquete, limite: int = 3) -> list[PaqueteSalida]:
    hoy = timezone.localdate()
    return [
        salida
        for salida in paquete.salidas.all()
        if salida.fecha_salida >= hoy and salida.cupos_disponibles > 0
    ][:limite]


def _linea_paquete(paquete: Paquete) -> str:
    salidas = _proximas_salidas(paquete)
    salida_txt = (
        f" · próxima salida {_fecha(salidas[0].fecha_salida)}"
        if salidas
        else " · sin salidas futuras con cupo"
    )
    return (
        f"• {paquete.nombre} — {paquete.destino.nombre}, "
        f"{paquete.destino.pais} · {paquete.duracion_dias} días · "
        f"{_dinero(paquete.precio_base, paquete.moneda)}{salida_txt}"
    )


def _extraer_codigo(texto: str) -> str | None:
    encontrado = re.search(r"\bRES-\d{4}-\d{1,6}\b", texto, re.IGNORECASE)
    return encontrado.group(0).upper() if encontrado else None


def _extraer_personas(texto: str) -> int:
    normalizado = _normalizar(texto)
    palabras = {
        "un": 1,
        "una": 1,
        "uno": 1,
        "dos": 2,
        "tres": 3,
        "cuatro": 4,
        "cinco": 5,
        "seis": 6,
        "siete": 7,
        "ocho": 8,
        "nueve": 9,
        "diez": 10,
    }
    patrones = (
        r"(\d+)\s*(?:personas?|viajeros?|pasajeros?|adultos?|pax)",
        r"(?:para|somos|seremos)\s+(\d+)",
        r"\b(\d+)\s*(?:personas?|viajeros?|pasajeros?|adultos?|pax)\b",
    )
    for patron in patrones:
        encontrado = re.search(patron, normalizado)
        if encontrado:
            return max(1, min(int(encontrado.group(1)), 20))
    for palabra, valor in palabras.items():
        if re.search(rf"\b{palabra}\b", normalizado):
            return valor
    return 1


def _extraer_fecha(texto: str) -> date | None:
    patrones = (
        (r"\b(\d{4})-(\d{2})-(\d{2})\b", ("year", "month", "day")),
        (r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", ("day", "month", "year")),
        (r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2})\b", ("day", "month", "year_corto")),
    )
    for patron, orden in patrones:
        encontrado = re.search(patron, texto)
        if not encontrado:
            continue
        partes = dict(zip(orden, encontrado.groups()))
        try:
            anio = int(partes["year"]) if "year" in partes else int(partes["year_corto"]) + 2000
            return date(anio, int(partes["month"]), int(partes["day"]))
        except (KeyError, ValueError):
            continue
    return None


def _extraer_monto(texto: str) -> Decimal | None:
    sin_codigo = re.sub(
        r"\bRES-\d{4}-\d{1,6}\b", "", texto, flags=re.IGNORECASE
    )
    encontrado = re.search(
        r"(?:monto|pago|abono|adelanto|pagar)\D{0,16}"
        r"(?:bob|usd|eur|bs|\$)?\s*([0-9]+(?:[.,][0-9]{1,2})?)",
        _normalizar(sin_codigo),
        re.IGNORECASE,
    )
    if not encontrado:
        return None
    try:
        return Decimal(encontrado.group(1).replace(",", "."))
    except InvalidOperation:
        return None


def _extraer_metodo(texto: str) -> str:
    normalizado = _normalizar(texto)
    for metodo in ("transferencia", "efectivo", "tarjeta", "qr"):
        if metodo in normalizado:
            return metodo
    return "efectivo"


def _rango_ventas(texto: str) -> tuple[date, date, str]:
    hoy = timezone.localdate()
    normalizado = _normalizar(texto)
    if "hoy" in normalizado:
        return hoy, hoy, "hoy"
    if "semana" in normalizado:
        return hoy - timedelta(days=6), hoy, "últimos 7 días"
    if "ano" in normalizado or "año" in normalizado or "anual" in normalizado:
        return date(hoy.year, 1, 1), hoy, f"año {hoy.year}"
    if "mes" in normalizado:
        return date(hoy.year, hoy.month, 1), hoy, "mes en curso"
    return date(hoy.year, hoy.month, 1), hoy, "mes en curso"


def _cliente_de(usuario):
    return getattr(usuario, "cliente", None)


def _reservas_visibles(usuario):
    qs = Reserva.objects.select_related(
        "cliente", "salida", "salida__paquete", "salida__paquete__destino"
    ).prefetch_related("pagos")
    if rol_para_permisos(usuario) == NOMBRE_CLIENTE:
        cliente = _cliente_de(usuario)
        if cliente is None:
            return Reserva.objects.none()
        return qs.filter(cliente=cliente)
    return qs


def _reserva_visible_codigo(usuario, codigo: str) -> Reserva | None:
    return _reservas_visibles(usuario).filter(codigo__iexact=codigo).first()


def _reserva_visible_id(usuario, reserva_id: int | str) -> Reserva | None:
    return _reservas_visibles(usuario).filter(pk=reserva_id).first()


def _reserva_base(usuario, texto: str) -> Reserva | None:
    codigo = _extraer_codigo(texto)
    if codigo:
        return _reserva_visible_codigo(usuario, codigo)
    if rol_para_permisos(usuario) == NOMBRE_CLIENTE:
        return _reservas_visibles(usuario).first()
    return None


def _formatear_reserva(reserva: Reserva) -> str:
    pagado = total_pagado(reserva)
    saldo = saldo_pendiente(reserva)
    salida = reserva.salida
    return (
        f"• {reserva.codigo} · {salida.paquete.nombre}\n"
        f"  Salida {_fecha(salida.fecha_salida)} · {reserva.num_personas} pasajero(s)\n"
        f"  Estado: {reserva.get_estado_display()} · Total "
        f"{_dinero(reserva.total, reserva.moneda)}\n"
        f"  Pagado: {_dinero(pagado, reserva.moneda)} · Saldo: "
        f"{_dinero(saldo, reserva.moneda)}"
    )


def _mensaje_error(exc: DjangoValidationError) -> str:
    detalle = getattr(exc, "message_dict", None)
    if detalle:
        return "; ".join(
            f"{campo}: {', '.join(str(item) for item in valores)}"
            for campo, valores in detalle.items()
        )
    return "; ".join(str(item) for item in getattr(exc, "messages", [str(exc)]))


def _listar_salidas(texto: str, *, limite: int = 8) -> str:
    paquete = _mejor_paquete(texto)
    fecha_buscada = _extraer_fecha(texto)
    salidas = _salidas_futuras(paquete.id if paquete else None)
    if fecha_buscada:
        exactas = [salida for salida in salidas if salida.fecha_salida == fecha_buscada]
        if exactas:
            salidas = exactas
    if not salidas:
        return "No encontré salidas futuras con cupo para esa búsqueda."

    lineas = ["Estas son las salidas con cupo disponible:"]
    for salida in salidas[:limite]:
        lineas.append(
            f"• {salida.paquete.nombre} · {_fecha(salida.fecha_salida)} · "
            f"{salida.cupos_disponibles}/{salida.cupos_totales} cupos · "
            f"{_dinero(salida.paquete.precio_base, salida.paquete.moneda)} por persona"
        )
    return "\n".join(lineas)


def _salida_para_reserva(texto: str, personas: int) -> PaqueteSalida | None:
    paquete = _mejor_paquete(texto)
    if paquete is None:
        return None
    salidas = _salidas_futuras(paquete.id)
    fecha_buscada = _extraer_fecha(texto)
    if fecha_buscada:
        salidas = [salida for salida in salidas if salida.fecha_salida == fecha_buscada]
    for salida in salidas:
        if salida.cupos_disponibles >= personas:
            return salida
    return None


def _resumen_pendiente(intencion: str, resumen: str, **datos) -> tuple[str, dict]:
    pendiente = {"intencion": intencion, "resumen": resumen, **datos}
    respuesta = (
        f"{resumen}\n\n"
        "¿Confirmas la operación? Responde «sí» para continuar o «no» para cancelar."
    )
    return respuesta, {"pendiente": pendiente}


def _responder_info(usuario, texto: str, intencion: str) -> str:
    paquetes = _paquetes()

    if intencion == "consultar_paquetes":
        if not paquetes:
            return "El catálogo no tiene paquetes activos en este momento."
        return "Paquetes activos:\n" + "\n".join(
            _linea_paquete(paquete) for paquete in paquetes[:8]
        )

    if intencion == "consultar_destinos":
        destinos = _destinos()
        if not destinos:
            return "El catálogo no tiene destinos activos en este momento."
        lineas = ["Destinos activos:"]
        for destino in destinos[:8]:
            precio = (
                f" · desde {_dinero(destino.precio_desde, destino.moneda)}"
                if destino.precio_desde is not None
                else ""
            )
            lineas.append(f"• {destino.nombre}, {destino.pais}{precio}")
        return "\n".join(lineas)

    if intencion == "consultar_precios":
        paquete = _mejor_paquete(texto, paquetes)
        if paquete:
            return (
                f"{paquete.nombre}: {_dinero(paquete.precio_base, paquete.moneda)} "
                f"por persona, {paquete.duracion_dias} días en "
                f"{paquete.destino.nombre}."
            )
        return "Precios por persona:\n" + "\n".join(
            _linea_paquete(paquete) for paquete in paquetes[:8]
        )

    if intencion == "consultar_disponibilidad":
        return _listar_salidas(texto)

    if intencion == "consultar_incluye":
        paquete = _mejor_paquete(texto, paquetes)
        if paquete is None:
            return (
                "Dime el destino o el paquete y reviso sus inclusiones. "
                "Ahora mismo puedo mostrarte el catálogo activo si lo necesitas."
            )
        destino = paquete.destino
        incluye = ", ".join(destino.incluye or []) or "sin detalle registrado"
        no_incluye = ", ".join(destino.no_incluye or []) or "sin detalle registrado"
        hotel = f" Alojamiento: {paquete.hotel.nombre}." if paquete.hotel else ""
        return (
            f"{paquete.nombre} ({destino.nombre}).{hotel}\n"
            f"Incluye: {incluye}.\n"
            f"No incluye: {no_incluye}."
        )

    if intencion == "consultar_duracion":
        paquete = _mejor_paquete(texto, paquetes)
        if paquete:
            return (
                f"{paquete.nombre} dura {paquete.duracion_dias} días en "
                f"{paquete.destino.nombre}."
            )
        return "Duraciones del catálogo:\n" + "\n".join(
            f"• {paquete.nombre}: {paquete.duracion_dias} días"
            for paquete in paquetes[:8]
        )

    if intencion == "consultar_requisitos":
        paquete = _mejor_paquete(texto, paquetes)
        destino = paquete.destino.nombre if paquete else "el destino"
        return (
            f"Los requisitos para {destino} dependen de tu nacionalidad y del "
            "tipo de viaje. Revisa la ficha del destino o confirma con un agente "
            "los documentos, visas y seguros exigidos antes de reservar."
        )

    if intencion == "consultar_politicas":
        return (
            "Las condiciones de cancelación, cambios y devolución dependen de la "
            "tarifa del paquete y de la salida elegida. Indícame el código de tu "
            "reserva o el paquete y revisamos el caso con un agente antes de "
            "confirmar cualquier cambio."
        )

    if intencion == "consultar_formas_pago":
        return (
            "En línea se aceptan tarjeta y QR. En ventanilla se registran "
            "efectivo, tarjeta, QR y transferencia. El pago queda asociado a la "
            "reserva y se emite su comprobante."
        )

    if intencion == "consultar_tipo_cambio":
        tasas = []
        for origen in ("USD", "EUR"):
            tasa = (
                TipoCambio.objects.filter(
                    moneda_origen=origen, moneda_destino="BOB"
                )
                .order_by("-fecha")
                .first()
            )
            if tasa:
                tasas.append(
                    f"• 1 {origen} = {tasa.tasa:.6f} BOB (tasa del {_fecha(tasa.fecha)})"
                )
        if not tasas:
            return (
                "No hay una tasa de cambio vigente cargada en el sistema. "
                "Consulta con un agente antes de convertir el importe."
            )
        return "Tasas registradas:\n" + "\n".join(tasas)

    if intencion == "recomendar_destino":
        if rol_para_permisos(usuario) == NOMBRE_CLIENTE:
            from apps.ia.services.recomendaciones import (
                generar_recomendaciones,
                marcar_mostradas,
            )

            cliente = _cliente_de(usuario)
            if cliente is not None:
                recomendaciones = generar_recomendaciones(cliente, limite=3)
                marcar_mostradas(recomendaciones)
                if recomendaciones:
                    return "Pensado para ti:\n" + "\n".join(
                        f"• {item.paquete.nombre} · {item.paquete.destino.nombre} · "
                        f"{item.paquete.duracion_dias} días · "
                        f"{_dinero(item.paquete.precio_base, item.paquete.moneda)} "
                        f"· afinidad {round(float(item.puntaje) * 100)}%"
                        for item in recomendaciones
                    )
        interes = _mejor_paquete(texto, paquetes)
        sugeridos = [interes] if interes else paquetes[:3]
        return "Puedo recomendarte:\n" + "\n".join(
            _linea_paquete(paquete) for paquete in sugeridos
        )

    if intencion == "comparar_paquetes":
        encontrados = []
        for paquete in paquetes:
            if _puntaje_nombre(paquete.nombre, texto) > 0 and paquete not in encontrados:
                encontrados.append(paquete)
        if len(encontrados) < 2:
            return (
                "Dime los dos paquetes o destinos que quieres comparar. "
                "Puedo contrastar duración, precio, destino e inclusiones."
            )
        lineas = ["Comparación:"]
        for paquete in encontrados[:2]:
            lineas.append(
                f"• {paquete.nombre}: {paquete.destino.nombre}, "
                f"{paquete.duracion_dias} días, "
                f"{_dinero(paquete.precio_base, paquete.moneda)} por persona. "
                f"Incluye: {', '.join(paquete.destino.incluye or []) or 'sin detalle'}."
            )
        return "\n".join(lineas)

    if intencion == "solicitar_promociones":
        return (
            "No hay un módulo de promociones cargado en este momento. "
            "Estas son las tarifas vigentes del catálogo:\n"
            + "\n".join(_linea_paquete(paquete) for paquete in paquetes[:5])
        )

    if intencion == "hablar_con_agente":
        return (
            "Puedo derivarte con un agente. Déjame el motivo de la consulta y un "
            "teléfono o correo de contacto; si ya tienes una reserva, incluye su código."
        )

    if intencion == "ayuda":
        return (
            "Puedo consultar paquetes, destinos, precios, cupos, inclusiones, "
            "duración y tipo de cambio. Si inicias sesión, también puedo revisar "
            "tus reservas. Los agentes pueden buscar reservas y registrar pagos; "
            "solo el administrador accede a resumen de ventas y ocupación."
        )

    if intencion == "saludo":
        return (
            "Hola, soy el asistente de Illimani. Puedo ayudarte con paquetes, "
            "destinos, precios, disponibilidad y reservas. ¿Qué viaje estás pensando?"
        )

    if intencion == "despedida":
        return "Con gusto. Cuando quieras seguir planificando tu viaje, aquí estaré."

    return (
        "No estoy seguro de haber entendido. Puedo ayudarte con paquetes, destinos, "
        "precios, disponibilidad, requisitos, pagos y reservas. ¿Puedes reformularlo?"
    )


def _responder_estado_reserva(usuario, texto: str) -> str:
    codigo = _extraer_codigo(texto)
    if codigo:
        reserva = _reserva_visible_codigo(usuario, codigo)
        if reserva is None:
            return "No encontré una reserva con ese código entre las que puedes consultar."
        return _formatear_reserva(reserva)

    if rol_para_permisos(usuario) == NOMBRE_CLIENTE:
        reservas = list(_reservas_visibles(usuario)[:3])
        if not reservas:
            return "Todavía no tienes reservas registradas."
        return "Tus reservas más recientes:\n" + "\n\n".join(
            _formatear_reserva(reserva) for reserva in reservas
        )

    return "Indícame el código de reserva (por ejemplo RES-2026-000001) o busca por documento."


def _responder_buscar_reserva(usuario, texto: str) -> str:
    codigo = _extraer_codigo(texto)
    if codigo:
        reserva = _reserva_visible_codigo(usuario, codigo)
        if reserva:
            return _formatear_reserva(reserva)
        return "No encontré una reserva con ese código."

    candidatos = []
    documentos = re.findall(r"\b\d{5,}\b", texto)
    if documentos:
        for documento in documentos:
            candidatos.extend(
                list(_reservas_visibles(usuario).filter(cliente__documento_numero__icontains=documento)[:5])
            )
    else:
        tokens = [token for token in _tokens(texto) if token not in {"buscar", "busca", "cliente"}]
        consulta = Q()
        for token in tokens:
            consulta |= Q(cliente__nombres__icontains=token)
            consulta |= Q(cliente__apellidos__icontains=token)
            consulta |= Q(salida__paquete__nombre__icontains=token)
        if consulta:
            candidatos = list(_reservas_visibles(usuario).filter(consulta)[:5])

    unicos = {reserva.id: reserva for reserva in candidatos}
    if not unicos:
        return "No encontré reservas con ese criterio. Indica código, documento o nombre del cliente."
    return "Reservas encontradas:\n" + "\n\n".join(
        _formatear_reserva(reserva) for reserva in list(unicos.values())[:5]
    )


def _responder_registrar_pago(usuario, texto: str, estado: dict) -> tuple[str, dict]:
    reserva = _reserva_base(usuario, texto)
    if reserva is None:
        return (
            "Indícame el código de la reserva que vas a cobrar, por ejemplo "
            "RES-2026-000001, y el monto si es un abono.",
            estado,
        )
    if reserva.estado == Reserva.ESTADO_CANCELADA:
        return "No se puede registrar un pago sobre una reserva cancelada.", estado
    if reserva.estado == Reserva.ESTADO_PAGADA:
        return "Esa reserva ya está pagada.", estado

    saldo = saldo_pendiente(reserva)
    if saldo <= 0:
        return "La reserva no tiene saldo pendiente.", estado

    monto = _extraer_monto(texto) or saldo
    if monto <= 0:
        return "El monto debe ser mayor a cero.", estado
    if monto > saldo:
        return (
            f"El monto supera el saldo pendiente de "
            f"{_dinero(saldo, reserva.moneda)}.",
            estado,
        )

    metodo = _extraer_metodo(texto)
    resumen = (
        f"Voy a registrar un pago de {_dinero(monto, reserva.moneda)} con "
        f"{metodo} para la reserva {reserva.codigo}.\n"
        f"{_formatear_reserva(reserva)}"
    )
    return _resumen_pendiente(
        "registrar_pago",
        resumen,
        reserva_id=reserva.id,
        monto=str(monto),
        metodo=metodo,
    )


def _responder_cancelar(usuario, texto: str, estado: dict) -> tuple[str, dict]:
    reserva = _reserva_base(usuario, texto)
    if reserva is None:
        return (
            "Indícame el código de la reserva que quieres cancelar, por ejemplo "
            "RES-2026-000001.",
            estado,
        )
    if reserva.estado == Reserva.ESTADO_CANCELADA:
        return "La reserva ya está cancelada.", estado
    if reserva.estado == Reserva.ESTADO_PAGADA:
        return (
            "La reserva figura como pagada. Para cancelarla y gestionar una "
            "devolución, necesito que lo confirme un agente.",
            estado,
        )
    resumen = "Voy a cancelar esta reserva:\n" + _formatear_reserva(reserva)
    return _resumen_pendiente(
        "cancelar_reserva",
        resumen,
        reserva_id=reserva.id,
        codigo=reserva.codigo,
    )


def _responder_modificar(usuario, texto: str, estado: dict) -> tuple[str, dict]:
    reserva = _reserva_base(usuario, texto)
    if reserva is None:
        return (
            "Indícame el código de la reserva que quieres modificar y la nueva "
            "fecha de salida.",
            estado,
        )
    if reserva.estado not in (Reserva.ESTADO_PENDIENTE, Reserva.ESTADO_CONFIRMADA):
        return (
            "Solo se pueden cambiar reservas pendientes o confirmadas. "
            "Esta reserva está " + reserva.get_estado_display().lower() + ".",
            estado,
        )

    fecha_buscada = _extraer_fecha(texto)
    salidas = [
        salida
        for salida in _salidas_futuras(reserva.salida.paquete_id)
        if salida.id != reserva.salida_id
    ]
    if fecha_buscada:
        salidas = [salida for salida in salidas if salida.fecha_salida == fecha_buscada]
    if not fecha_buscada or not salidas:
        disponibles = [
            salida
            for salida in _salidas_futuras(reserva.salida.paquete_id)
            if salida.id != reserva.salida_id
        ]
        if disponibles:
            encabezado = (
                "No encontré esa fecha. "
                if fecha_buscada
                else "Indícame la nueva fecha. "
            )
            return (
                encabezado
                + f"Salidas disponibles para {reserva.salida.paquete.nombre}:\n"
                + "\n".join(
                    f"• {_fecha(salida.fecha_salida)} · "
                    f"{salida.cupos_disponibles} cupos"
                    for salida in disponibles[:6]
                ),
                estado,
            )
        return "Ese paquete no tiene otras salidas futuras con cupo.", estado

    nueva_salida = next(
        (
            salida
            for salida in salidas
            if salida.cupos_disponibles >= reserva.num_personas
        ),
        None,
    )
    if nueva_salida is None:
        return "No hay cupo suficiente en la nueva fecha para todos los pasajeros.", estado

    resumen = (
        f"Voy a cambiar la reserva {reserva.codigo} del "
        f"{_fecha(reserva.salida.fecha_salida)} al "
        f"{_fecha(nueva_salida.fecha_salida)}.\n"
        f"{_formatear_reserva(reserva)}"
    )
    return _resumen_pendiente(
        "modificar_reserva",
        resumen,
        reserva_id=reserva.id,
        nueva_salida_id=nueva_salida.id,
    )


def _responder_iniciar_reserva(usuario, texto: str, estado: dict) -> tuple[str, dict]:
    if rol_para_permisos(usuario) != NOMBRE_CLIENTE:
        return (
            "Desde el chat, la creación de reservas está limitada al viajero "
            "autenticado para su propio viaje. Para registrar una venta de "
            "mostrador utiliza el módulo de ventanilla.",
            estado,
        )

    cliente = _cliente_de(usuario)
    if cliente is None:
        return (
            "Tu usuario no tiene una ficha de viajero asociada. Completa tu "
            "perfil o solicita apoyo a un agente.",
            estado,
        )

    personas = _extraer_personas(texto)
    salida = _salida_para_reserva(texto, personas)
    if salida is None:
        return (
            "Dime el paquete o destino y la fecha de salida. Si no indicas fecha, "
            "tomo la próxima salida con cupo. Salidas disponibles:\n"
            + _listar_salidas(texto),
            estado,
        )

    if personas > 1:
        return (
            "El chat puede iniciar reservas de una persona con los datos de tu "
            f"perfil. Para {personas} viajeros, completa los datos de los "
            "pasajeros en la ficha del paquete o solicita apoyo a un agente.",
            estado,
        )

    resumen = (
        f"Voy a iniciar una reserva a tu nombre para "
        f"{salida.paquete.nombre} el {_fecha(salida.fecha_salida)} "
        f"({_dinero(salida.paquete.precio_base, salida.paquete.moneda)})."
    )
    return _resumen_pendiente(
        "iniciar_reserva",
        resumen,
        salida_id=salida.id,
        num_personas=1,
    )


def _responder_resumen_ventas(texto: str) -> str:
    desde, hasta, etiqueta = _rango_ventas(texto)
    datos = resumen_ventas(desde=desde, hasta=hasta)
    return (
        f"Resumen de ventas ({etiqueta}):\n"
        f"• Reservas: {datos['reservas']} · pagadas: {datos['reservas_pagadas']} "
        f"· canceladas: {datos['reservas_canceladas']}\n"
        f"• Pasajeros: {datos['pasajeros']}\n"
        f"• Ingresos: BOB {datos['ingresos_bob']:,.2f}\n"
        f"• Ticket promedio: BOB {datos['ticket_promedio_bob']:,.2f}"
    )


def _responder_ocupacion() -> str:
    hoy = timezone.localdate()
    datos = reporte_ocupacion(desde=hoy, hasta=hoy + timedelta(days=30))
    totales = datos["totales"]
    lineas = [
        "Ocupación de los próximos 30 días:",
        f"• Salidas: {totales['salidas']} · cupos: {totales['cupos_totales']}",
        f"• Vendidos: {totales['vendidos']} · disponibles: {totales['disponibles']}",
        f"• Ocupación: {totales['ocupacion_pct']}%",
    ]
    for salida in datos["salidas"][:5]:
        lineas.append(
            f"• {salida['paquete']} · {salida['fecha_salida']} · "
            f"{salida['ocupacion_pct']}% ({salida['vendidos']}/{salida['cupos_totales']})"
        )
    return "\n".join(lineas)


def construir_respuesta(
    usuario,
    texto: str,
    intencion: str,
    estado: dict | None = None,
    conversacion_id=None,
) -> tuple[str, dict]:
    """Devuelve (respuesta, estado_dialogo) para una intención permitida."""
    estado = dict(estado or {})
    estado.pop("pendiente", None)

    if intencion in {
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
        "fallback",
    }:
        return _responder_info(usuario, texto, intencion), estado

    if intencion == "estado_reserva":
        return _responder_estado_reserva(usuario, texto), estado

    if intencion == "buscar_reserva":
        return _responder_buscar_reserva(usuario, texto), estado

    if intencion == "consultar_cupos":
        return _listar_salidas(texto), estado

    if intencion == "registrar_pago":
        return _responder_registrar_pago(usuario, texto, estado)

    if intencion == "cancelar_reserva":
        return _responder_cancelar(usuario, texto, estado)

    if intencion == "modificar_reserva":
        return _responder_modificar(usuario, texto, estado)

    if intencion == "iniciar_reserva":
        return _responder_iniciar_reserva(usuario, texto, estado)

    if intencion == "resumen_ventas":
        if rol_para_permisos(usuario) != NOMBRE_ADMINISTRADOR:
            return "Ese resumen está reservado al administrador.", estado
        return _responder_resumen_ventas(texto), estado

    if intencion == "reporte_ocupacion":
        if rol_para_permisos(usuario) != NOMBRE_ADMINISTRADOR:
            return "Ese reporte está reservado al administrador.", estado
        return _responder_ocupacion(), estado

    return _responder_info(usuario, texto, "fallback"), estado


def ejecutar_pendiente(
    usuario,
    pendiente: dict,
    *,
    conversacion_id=None,
) -> tuple[str, dict]:
    """Ejecuta una acción previamente confirmada y limpia el estado pendiente."""
    intencion = pendiente.get("intencion", "")
    if not puede_usar_intencion(usuario, intencion):
        return "Tu rol ya no tiene permiso para completar esa operación.", {}

    try:
        if intencion == "cancelar_reserva":
            reserva = _reserva_visible_id(usuario, pendiente["reserva_id"])
            if reserva is None:
                return "No encontré la reserva o ya no está disponible.", {}
            cancelada = cancelar_reserva(reserva.id)
            return (
                f"Reserva {cancelada.codigo} cancelada. Los cupos fueron "
                "reintegrados a la salida.",
                {},
            )

        if intencion == "modificar_reserva":
            reserva = _reserva_visible_id(usuario, pendiente["reserva_id"])
            if reserva is None:
                return "No encontré la reserva o ya no está disponible.", {}
            modificada = modificar_salida_reserva(
                reserva.id, int(pendiente["nueva_salida_id"])
            )
            return (
                f"Reserva {modificada.codigo} movida al "
                f"{_fecha(modificada.salida.fecha_salida)}.",
                {},
            )

        if intencion == "registrar_pago":
            reserva = _reserva_visible_id(usuario, pendiente["reserva_id"])
            if reserva is None:
                return "No encontré la reserva o ya no está disponible.", {}
            pago = registrar_pago(
                reserva_id=reserva.id,
                monto=Decimal(str(pendiente["monto"])),
                metodo=pendiente.get("metodo", "efectivo"),
            )
            reserva.refresh_from_db()
            return (
                f"Pago registrado por {_dinero(pago.monto, pago.moneda)}. "
                f"La reserva {reserva.codigo} queda como "
                f"{reserva.get_estado_display().lower()}.",
                {},
            )

        if intencion == "iniciar_reserva":
            cliente = _cliente_de(usuario)
            if cliente is None:
                return "Tu usuario no tiene una ficha de viajero asociada.", {}
            salida = (
                PaqueteSalida.objects.select_related("paquete")
                .filter(pk=pendiente["salida_id"])
                .first()
            )
            if salida is None:
                return "La salida ya no está disponible.", {}
            pasajero = {
                "nombres": cliente.nombres,
                "apellidos": cliente.apellidos,
                "documento_tipo": cliente.documento_tipo,
                "documento_numero": cliente.documento_numero,
                "fecha_nacimiento": cliente.fecha_nacimiento,
            }
            reserva = crear_reserva(
                cliente_id=cliente.id,
                salida_id=salida.id,
                num_personas=1,
                pasajeros_datos=[pasajero],
                canal=Reserva.CANAL_AGENTE,
                conversacion_id=conversacion_id,
            )
            return (
                f"Reserva {reserva.codigo} creada para "
                f"{salida.paquete.nombre} el {_fecha(salida.fecha_salida)}. "
                f"Total: {_dinero(reserva.total, reserva.moneda)}. "
                "Puedes pagarla desde «Mi viaje».",
                {},
            )
    except DjangoValidationError as exc:
        return f"No pude completar la operación: {_mensaje_error(exc)}", {}

    return "La operación pendiente ya no es válida.", {}


def respuesta_denegada(usuario, intencion: str) -> str:
    """Mensaje específico cuando el rol no puede usar una intención."""
    rol = rol_para_permisos(usuario)
    if rol == ROL_ANONIMO:
        return (
            "Para consultar reservas o realizar esa acción necesitas iniciar "
            "sesión. También puedes pedir atención con un agente."
        )
    if intencion in {"resumen_ventas", "reporte_ocupacion"}:
        return "Esa consulta está reservada al administrador de la agencia."
    if rol == NOMBRE_CLIENTE:
        if intencion == "registrar_pago":
            return (
                "El registro manual de pagos corresponde al equipo interno. "
                "Puedes pagar tu reserva desde «Mi viaje» con tarjeta o QR."
            )
        if intencion in {"buscar_reserva", "consultar_cupos"}:
            return (
                "Puedo consultar tus propias reservas con su código. Para buscar "
                "reservas de otros clientes o revisar cupos internos, contacta a un agente."
            )
    if rol == NOMBRE_AGENTE:
        return (
            "Tu rol de agente no tiene acceso a reportes gerenciales ni a la "
            "configuración del asistente."
        )
    return (
        "Tu rol no tiene permiso para esa función. Puedo ayudarte con información "
        "de viajes, paquetes y disponibilidad."
    )
