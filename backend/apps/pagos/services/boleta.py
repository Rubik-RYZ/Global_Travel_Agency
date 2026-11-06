"""Generacion de la boleta de viaje en PDF (CU9).

La boleta es un unico archivo descargable que resume lo que compro el viajero:
paquete/destino, tipo de viaje (ida, vuelta o reserva), un asiento asignado de
forma estable por pasajero y los datos del pago. No se persiste nada nuevo: todo
se deriva de la reserva y de su pago aprobado.
"""
from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

AZUL = colors.HexColor("#792609")
TINTA = colors.HexColor("#231a13")
GRIS = colors.HexColor("#6b6259")
CREMA = colors.HexColor("#faf5eb")
TERRACOTA = colors.HexColor("#b85434")
LINEA = colors.HexColor("#d8cfc1")

LETRAS_ASIENTO = "ABCDEF"


def asiento_para(reserva_id: int, indice: int) -> str:
    """Asiento deterministico (fila + letra) para que no cambie entre descargas."""
    base = int(reserva_id) + int(indice)
    fila = (base % 30) + 1
    letra = LETRAS_ASIENTO[(base // 30) % len(LETRAS_ASIENTO)]
    return f"{fila}{letra}"


def _tipo_viaje(reserva) -> str:
    salida = reserva.salida
    if salida.vuelo_ida_id and salida.vuelo_vuelta_id:
        return "Ida y vuelta"
    if salida.vuelo_ida_id:
        return "Solo ida"
    return "Reserva de paquete"


def _descripcion(reserva) -> str:
    paquete = reserva.salida.paquete
    destino = paquete.destino
    ubicacion = f"{destino.nombre}, {destino.pais}" if destino else "Destino internacional"
    return f"{paquete.nombre} - {ubicacion} ({paquete.duracion_dias} dias)"


def _fecha(valor) -> str:
    return valor.strftime("%d/%m/%Y") if valor else "-"


def _campo(c: canvas.Canvas, x: float, y: float, etiqueta: str, valor: str) -> None:
    c.setFillColor(GRIS)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y, etiqueta.upper())
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 11)
    c.drawString(x, y - 5 * mm, str(valor))


def generar_boleta_pdf(*, reserva, pago) -> bytes:
    """Devuelve el PDF (bytes) de la boleta de una reserva pagada."""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    ancho, alto = A4
    margen = 18 * mm

    # --- Cabecera ---
    c.setFillColor(AZUL)
    c.rect(0, alto - 42 * mm, ancho, 42 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(margen, alto - 21 * mm, "ILLIMANI GLOBAL TRAVEL S.R.L.")
    c.setFont("Helvetica", 9.5)
    c.drawString(margen, alto - 28 * mm, "Tour operador internacional - Boleta oficial de viaje")
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(ancho - margen, alto - 21 * mm, "BOLETA DE VIAJE")
    c.setFont("Helvetica", 9.5)
    c.drawRightString(ancho - margen, alto - 28 * mm, f"N. {reserva.codigo}")
    c.setFillColor(TERRACOTA)
    c.setFont("Helvetica-Bold", 8)
    c.drawRightString(ancho - margen, alto - 35 * mm, f"Emitida: {_fecha(reserva.creada_en)}")

    y = alto - 56 * mm

    # --- Titular ---
    cliente = reserva.cliente
    _campo(c, margen, y, "Pasajero titular", cliente.nombre_completo)
    _campo(c, margen + 95 * mm, y, "Documento", cliente.documento_numero or "Sin documento")
    _campo(c, ancho - margen - 25 * mm, y, "Pasajeros", str(reserva.num_personas))
    y -= 20 * mm

    # --- Detalle de la compra ---
    c.setStrokeColor(LINEA)
    c.setLineWidth(0.7)
    c.line(margen, y, ancho - margen, y)
    y -= 10 * mm

    c.setFillColor(AZUL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margen, y, "DETALLE DE LA COMPRA")
    y -= 9 * mm

    _campo(c, margen, y, "Descripcion", _descripcion(reserva))
    y -= 17 * mm
    _campo(c, margen, y, "Tipo de viaje", _tipo_viaje(reserva))
    _campo(c, margen + 70 * mm, y, "Fecha de salida", _fecha(reserva.salida.fecha_salida))
    _campo(c, ancho - margen - 30 * mm, y, "Canal", dict(reserva.CANAL_CHOICES).get(reserva.canal, reserva.canal))
    y -= 20 * mm

    # --- Manifiesto / asientos ---
    c.setFillColor(AZUL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margen, y, "PASAJEROS Y ASIENTOS ASIGNADOS")
    y -= 7 * mm

    c.setFillColor(CREMA)
    c.rect(margen, y - 2 * mm, ancho - 2 * margen, 8 * mm, fill=1, stroke=0)
    c.setFillColor(GRIS)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(margen + 3 * mm, y + 1 * mm, "PASAJERO")
    c.drawString(margen + 95 * mm, y + 1 * mm, "DOCUMENTO")
    c.drawRightString(ancho - margen - 3 * mm, y + 1 * mm, "ASIENTO")
    y -= 9 * mm

    pasajeros = list(reserva.pasajeros.all())
    c.setFont("Helvetica", 10)
    for indice, pasajero in enumerate(pasajeros):
        c.setFillColor(TINTA)
        c.drawString(margen + 3 * mm, y, f"{pasajero.nombres} {pasajero.apellidos}")
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 9.5)
        doc = pasajero.documento_numero or "S/N"
        c.drawString(margen + 95 * mm, y, f"{pasajero.documento_tipo or ''} {doc}".strip())
        c.setFillColor(TERRACOTA)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(ancho - margen - 3 * mm, y, asiento_para(reserva.id, indice))
        c.setFillColor(TINTA)
        c.setFont("Helvetica", 10)
        y -= 7 * mm
        if y < 70 * mm:
            c.showPage()
            y = alto - 30 * mm

    y -= 3 * mm

    # --- Liquidacion ---
    c.setStrokeColor(LINEA)
    c.line(margen, y, ancho - margen, y)
    y -= 10 * mm

    c.setFillColor(AZUL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margen, y, "LIQUIDACION")
    y -= 9 * mm

    metodo = pago.get_metodo_display() if hasattr(pago, "get_metodo_display") else pago.metodo
    _campo(c, margen, y, "Metodo de pago", str(metodo).capitalize())
    _campo(c, margen + 70 * mm, y, "Estado", "Pagado")
    _campo(c, ancho - margen - 30 * mm, y, "Total", f"{pago.moneda} {pago.monto:.2f}")
    y -= 17 * mm
    _campo(c, margen, y, "Equivalente en Bs", f"Bs {pago.monto_bob:.2f}")
    _campo(c, margen + 70 * mm, y, "Tasa aplicada", f"{pago.tipo_cambio_a_bob}")
    y -= 18 * mm

    # --- Pie ---
    c.setFillColor(CREMA)
    c.rect(0, 0, ancho, 20 * mm, fill=1, stroke=0)
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 8)
    c.drawString(margen, 12 * mm, "Gracias por viajar con Illimani Global Travel. Presente esta boleta al abordar.")
    c.drawString(margen, 7 * mm, f"Reserva {reserva.codigo} - Documento generado electronicamente.")

    c.showPage()
    c.save()
    return buffer.getvalue()
