"""Agregaciones de reportes gerenciales calculadas sobre las tablas existentes.

No se crean tablas nuevas: ventas e ingresos salen de `reservas` y `pagos`,
mientras que la ocupacion se deriva de `paquete_salidas`.
"""
from __future__ import annotations

import csv
import io
from datetime import date
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek

from apps.catalogo.models import PaqueteSalida
from apps.pagos.models import Pago
from apps.reservas.models import Reserva

AGRUPACIONES = {
    "dia": TruncDay,
    "semana": TruncWeek,
    "mes": TruncMonth,
}

ETIQUETAS_CANAL = dict(Reserva.CANAL_CHOICES)


def _num(valor) -> float:
    return round(float(valor or 0), 2)


def _clave_periodo(valor, agrupacion: str) -> str:
    if agrupacion == "mes":
        return valor.strftime("%Y-%m")
    return valor.strftime("%Y-%m-%d")


def _etiqueta_periodo(valor, agrupacion: str) -> str:
    if agrupacion == "mes":
        return valor.strftime("%m/%Y")
    if agrupacion == "semana":
        return f"Sem {valor.strftime('%d/%m')}"
    return valor.strftime("%d/%m")


def _reservas(desde: date, hasta: date, canal: str | None = None):
    qs = Reserva.objects.filter(
        creada_en__date__gte=desde,
        creada_en__date__lte=hasta,
    )
    if canal:
        qs = qs.filter(canal=canal)
    return qs


def _reservas_validas(desde: date, hasta: date, canal: str | None = None):
    return _reservas(desde, hasta, canal).exclude(estado=Reserva.ESTADO_CANCELADA)


def _pagos(desde: date, hasta: date, canal: str | None = None):
    qs = Pago.objects.filter(
        estado=Pago.Estado.APROBADO,
        creado_en__date__gte=desde,
        creado_en__date__lte=hasta,
    )
    if canal:
        qs = qs.filter(reserva__canal=canal)
    return qs


def _fila(periodo: str, etiqueta: str) -> dict:
    return {
        "periodo": periodo,
        "etiqueta": etiqueta,
        "reservas": 0,
        "pasajeros": 0,
        "ingresos_bob": 0.0,
    }


def resumen_ventas(*, desde: date, hasta: date, canal: str | None = None) -> dict:
    validas = _reservas_validas(desde, hasta, canal)
    pagos = _pagos(desde, hasta, canal)

    reservas = validas.count()
    pagadas = validas.filter(estado=Reserva.ESTADO_PAGADA).count()
    pasajeros = validas.aggregate(total=Sum("num_personas"))["total"] or 0
    ingresos = pagos.aggregate(total=Sum("monto_bob"))["total"] or Decimal("0")
    canceladas = _reservas(desde, hasta, canal).filter(
        estado=Reserva.ESTADO_CANCELADA
    ).count()

    return {
        "reservas": reservas,
        "reservas_pagadas": pagadas,
        "reservas_canceladas": canceladas,
        "pasajeros": int(pasajeros),
        "ingresos_bob": _num(ingresos),
        "ticket_promedio_bob": _num(Decimal(ingresos) / pagadas) if pagadas else 0.0,
    }


def serie_ventas(
    *, desde: date, hasta: date, agrupacion: str = "dia", canal: str | None = None
) -> list[dict]:
    trunc = AGRUPACIONES[agrupacion]

    reservas = (
        _reservas_validas(desde, hasta, canal)
        .annotate(periodo=trunc("creada_en"))
        .values("periodo")
        .annotate(reservas=Count("id"), pasajeros=Sum("num_personas"))
        .order_by("periodo")
    )
    pagos = (
        _pagos(desde, hasta, canal)
        .annotate(periodo=trunc("creado_en"))
        .values("periodo")
        .annotate(ingresos=Sum("monto_bob"))
        .order_by("periodo")
    )

    filas: dict[str, dict] = {}
    for item in reservas:
        clave = _clave_periodo(item["periodo"], agrupacion)
        fila = filas.setdefault(clave, _fila(clave, _etiqueta_periodo(item["periodo"], agrupacion)))
        fila["reservas"] = item["reservas"]
        fila["pasajeros"] = int(item["pasajeros"] or 0)

    for item in pagos:
        clave = _clave_periodo(item["periodo"], agrupacion)
        fila = filas.setdefault(clave, _fila(clave, _etiqueta_periodo(item["periodo"], agrupacion)))
        fila["ingresos_bob"] = _num(item["ingresos"])

    return [filas[clave] for clave in sorted(filas)]


def por_canal(*, desde: date, hasta: date, canal: str | None = None) -> list[dict]:
    filas: dict[str, dict] = {}

    reservas = (
        _reservas_validas(desde, hasta, canal)
        .values("canal")
        .annotate(reservas=Count("id"), pasajeros=Sum("num_personas"))
    )
    for item in reservas:
        filas[item["canal"]] = {
            "canal": item["canal"],
            "etiqueta": ETIQUETAS_CANAL.get(item["canal"], item["canal"]),
            "reservas": item["reservas"],
            "pasajeros": int(item["pasajeros"] or 0),
            "ingresos_bob": 0.0,
        }

    pagos = (
        _pagos(desde, hasta, canal)
        .values("reserva__canal")
        .annotate(ingresos=Sum("monto_bob"))
    )
    for item in pagos:
        clave = item["reserva__canal"]
        fila = filas.setdefault(
            clave,
            {
                "canal": clave,
                "etiqueta": ETIQUETAS_CANAL.get(clave, clave),
                "reservas": 0,
                "pasajeros": 0,
                "ingresos_bob": 0.0,
            },
        )
        fila["ingresos_bob"] = _num(item["ingresos"])

    return sorted(filas.values(), key=lambda f: f["ingresos_bob"], reverse=True)


def por_paquete(*, desde: date, hasta: date, canal: str | None = None) -> list[dict]:
    filas: dict[int | None, dict] = {}

    reservas = (
        _reservas_validas(desde, hasta, canal)
        .values(
            "salida__paquete__id",
            "salida__paquete__nombre",
            "salida__paquete__destino__nombre",
        )
        .annotate(reservas=Count("id"), pasajeros=Sum("num_personas"))
    )
    for item in reservas:
        clave = item["salida__paquete__id"]
        filas[clave] = {
            "paquete_id": clave,
            "paquete": item["salida__paquete__nombre"] or "Sin paquete",
            "destino": item["salida__paquete__destino__nombre"] or "-",
            "reservas": item["reservas"],
            "pasajeros": int(item["pasajeros"] or 0),
            "ingresos_bob": 0.0,
        }

    pagos = (
        _pagos(desde, hasta, canal)
        .values(
            "reserva__salida__paquete__id",
            "reserva__salida__paquete__nombre",
            "reserva__salida__paquete__destino__nombre",
        )
        .annotate(ingresos=Sum("monto_bob"))
    )
    for item in pagos:
        clave = item["reserva__salida__paquete__id"]
        fila = filas.setdefault(
            clave,
            {
                "paquete_id": clave,
                "paquete": item["reserva__salida__paquete__nombre"] or "Sin paquete",
                "destino": item["reserva__salida__paquete__destino__nombre"] or "-",
                "reservas": 0,
                "pasajeros": 0,
                "ingresos_bob": 0.0,
            },
        )
        fila["ingresos_bob"] = _num(item["ingresos"])

    return sorted(filas.values(), key=lambda f: f["ingresos_bob"], reverse=True)


def por_destino(*, desde: date, hasta: date, canal: str | None = None) -> list[dict]:
    filas: dict[str, dict] = {}

    reservas = (
        _reservas_validas(desde, hasta, canal)
        .values(
            "salida__paquete__destino__nombre",
            "salida__paquete__destino__pais",
        )
        .annotate(reservas=Count("id"), pasajeros=Sum("num_personas"))
    )
    for item in reservas:
        clave = item["salida__paquete__destino__nombre"] or "Sin destino"
        filas[clave] = {
            "destino": clave,
            "pais": item["salida__paquete__destino__pais"] or "-",
            "reservas": item["reservas"],
            "pasajeros": int(item["pasajeros"] or 0),
            "ingresos_bob": 0.0,
        }

    pagos = (
        _pagos(desde, hasta, canal)
        .values(
            "reserva__salida__paquete__destino__nombre",
            "reserva__salida__paquete__destino__pais",
        )
        .annotate(ingresos=Sum("monto_bob"))
    )
    for item in pagos:
        clave = item["reserva__salida__paquete__destino__nombre"] or "Sin destino"
        fila = filas.setdefault(
            clave,
            {
                "destino": clave,
                "pais": item["reserva__salida__paquete__destino__pais"] or "-",
                "reservas": 0,
                "pasajeros": 0,
                "ingresos_bob": 0.0,
            },
        )
        fila["ingresos_bob"] = _num(item["ingresos"])

    return sorted(filas.values(), key=lambda f: f["ingresos_bob"], reverse=True)


def por_metodo(*, desde: date, hasta: date, canal: str | None = None) -> list[dict]:
    filas = (
        _pagos(desde, hasta, canal)
        .values("metodo")
        .annotate(pagos=Count("id"), ingresos=Sum("monto_bob"))
        .order_by("-ingresos")
    )
    return [
        {
            "metodo": item["metodo"] or "otro",
            "pagos": item["pagos"],
            "ingresos_bob": _num(item["ingresos"]),
        }
        for item in filas
    ]


def por_empleado(*, desde: date, hasta: date, canal: str | None = None) -> list[dict]:
    filas: dict[int | None, dict] = {}

    reservas = (
        _reservas_validas(desde, hasta, canal)
        .values("registrado_por__id", "registrado_por__email")
        .annotate(reservas=Count("id"), pasajeros=Sum("num_personas"))
    )
    for item in reservas:
        clave = item["registrado_por__id"]
        filas[clave] = {
            "usuario_id": clave,
            "email": item["registrado_por__email"] or "Sin asignar",
            "reservas": item["reservas"],
            "pasajeros": int(item["pasajeros"] or 0),
            "ingresos_bob": 0.0,
        }

    pagos = (
        _pagos(desde, hasta, canal)
        .values("reserva__registrado_por__id", "reserva__registrado_por__email")
        .annotate(ingresos=Sum("monto_bob"))
    )
    for item in pagos:
        clave = item["reserva__registrado_por__id"]
        fila = filas.setdefault(
            clave,
            {
                "usuario_id": clave,
                "email": item["reserva__registrado_por__email"] or "Sin asignar",
                "reservas": 0,
                "pasajeros": 0,
                "ingresos_bob": 0.0,
            },
        )
        fila["ingresos_bob"] = _num(item["ingresos"])

    return sorted(
        filas.values(),
        key=lambda f: (f["ingresos_bob"], f["reservas"]),
        reverse=True,
    )


def reporte_ventas(
    *, desde: date, hasta: date, agrupacion: str = "dia", canal: str | None = None
) -> dict:
    return {
        "rango": {
            "desde": desde.isoformat(),
            "hasta": hasta.isoformat(),
            "agrupacion": agrupacion,
            "canal": canal,
        },
        "resumen": resumen_ventas(desde=desde, hasta=hasta, canal=canal),
        "serie": serie_ventas(
            desde=desde, hasta=hasta, agrupacion=agrupacion, canal=canal
        ),
        "por_canal": por_canal(desde=desde, hasta=hasta, canal=canal),
        "por_paquete": por_paquete(desde=desde, hasta=hasta, canal=canal),
        "por_destino": por_destino(desde=desde, hasta=hasta, canal=canal),
        "por_metodo": por_metodo(desde=desde, hasta=hasta, canal=canal),
        "por_empleado": por_empleado(desde=desde, hasta=hasta, canal=canal),
    }


def csv_ventas(
    *, desde: date, hasta: date, agrupacion: str = "dia", canal: str | None = None
) -> str:
    datos = reporte_ventas(
        desde=desde, hasta=hasta, agrupacion=agrupacion, canal=canal
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")

    writer.writerow(["Reporte de ventas - Illimani Global Travel"])
    writer.writerow(["Desde", datos["rango"]["desde"], "Hasta", datos["rango"]["hasta"]])
    writer.writerow([
        "Agrupacion",
        datos["rango"]["agrupacion"],
        "Canal",
        datos["rango"]["canal"] or "todos",
    ])
    writer.writerow([])

    resumen = datos["resumen"]
    writer.writerow(["Resumen"])
    writer.writerow([
        "Reservas",
        "Reservas pagadas",
        "Reservas canceladas",
        "Pasajeros",
        "Ingresos BOB",
        "Ticket promedio BOB",
    ])
    writer.writerow([
        resumen["reservas"],
        resumen["reservas_pagadas"],
        resumen["reservas_canceladas"],
        resumen["pasajeros"],
        resumen["ingresos_bob"],
        resumen["ticket_promedio_bob"],
    ])
    writer.writerow([])

    writer.writerow(["Serie"])
    writer.writerow(["Periodo", "Reservas", "Pasajeros", "Ingresos BOB"])
    for fila in datos["serie"]:
        writer.writerow([
            fila["periodo"],
            fila["reservas"],
            fila["pasajeros"],
            fila["ingresos_bob"],
        ])
    writer.writerow([])

    writer.writerow(["Por canal"])
    writer.writerow(["Canal", "Reservas", "Pasajeros", "Ingresos BOB"])
    for fila in datos["por_canal"]:
        writer.writerow([
            fila["etiqueta"],
            fila["reservas"],
            fila["pasajeros"],
            fila["ingresos_bob"],
        ])
    writer.writerow([])

    writer.writerow(["Por paquete"])
    writer.writerow(["Paquete", "Destino", "Reservas", "Pasajeros", "Ingresos BOB"])
    for fila in datos["por_paquete"]:
        writer.writerow([
            fila["paquete"],
            fila["destino"],
            fila["reservas"],
            fila["pasajeros"],
            fila["ingresos_bob"],
        ])
    writer.writerow([])

    writer.writerow(["Por destino"])
    writer.writerow(["Destino", "Pais", "Reservas", "Pasajeros", "Ingresos BOB"])
    for fila in datos["por_destino"]:
        writer.writerow([
            fila["destino"],
            fila["pais"],
            fila["reservas"],
            fila["pasajeros"],
            fila["ingresos_bob"],
        ])
    writer.writerow([])

    writer.writerow(["Por metodo de pago"])
    writer.writerow(["Metodo", "Pagos", "Ingresos BOB"])
    for fila in datos["por_metodo"]:
        writer.writerow([fila["metodo"], fila["pagos"], fila["ingresos_bob"]])
    writer.writerow([])

    writer.writerow(["Por empleado / ventanilla"])
    writer.writerow(["Usuario", "Reservas", "Pasajeros", "Ingresos BOB"])
    for fila in datos["por_empleado"]:
        writer.writerow([
            fila["email"],
            fila["reservas"],
            fila["pasajeros"],
            fila["ingresos_bob"],
        ])

    return "\ufeff" + buffer.getvalue()


def reporte_ocupacion(
    *, desde: date, hasta: date, paquete_id: int | None = None
) -> dict:
    salidas = PaqueteSalida.objects.select_related(
        "paquete", "paquete__destino"
    ).filter(fecha_salida__gte=desde, fecha_salida__lte=hasta)
    if paquete_id:
        salidas = salidas.filter(paquete_id=paquete_id)
    salidas = salidas.order_by("fecha_salida", "paquete__nombre")

    filas = []
    for salida in salidas:
        totales = salida.cupos_totales or 0
        disponibles = salida.cupos_disponibles or 0
        vendidos = max(totales - disponibles, 0)
        filas.append(
            {
                "id": salida.id,
                "paquete_id": salida.paquete_id,
                "paquete": salida.paquete.nombre,
                "destino": salida.paquete.destino.nombre,
                "fecha_salida": salida.fecha_salida.isoformat(),
                "cupos_totales": totales,
                "cupos_disponibles": disponibles,
                "vendidos": vendidos,
                "ocupacion_pct": round((vendidos / totales) * 100, 2) if totales else 0.0,
            }
        )

    cupos_totales = sum(fila["cupos_totales"] for fila in filas)
    vendidos = sum(fila["vendidos"] for fila in filas)
    disponibles = sum(fila["cupos_disponibles"] for fila in filas)

    return {
        "rango": {"desde": desde.isoformat(), "hasta": hasta.isoformat()},
        "totales": {
            "salidas": len(filas),
            "cupos_totales": cupos_totales,
            "vendidos": vendidos,
            "disponibles": disponibles,
            "ocupacion_pct": round((vendidos / cupos_totales) * 100, 2)
            if cupos_totales
            else 0.0,
        },
        "salidas": filas,
    }
