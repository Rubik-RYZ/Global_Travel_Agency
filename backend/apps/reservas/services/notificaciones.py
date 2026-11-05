"""Capa de negocio de notificaciones para reservas e itinerarios (CU8)."""
from __future__ import annotations

import logging
from django.db import transaction
from django.db.models import QuerySet

from apps.notificaciones.services.envio import enviar
from apps.reservas.models import Notificacion, Reserva

logger = logging.getLogger(__name__)


def listar_notificaciones(*, usuario_id: int) -> QuerySet[Notificacion]:
    return Notificacion.objects.filter(usuario_id=usuario_id).select_related("reserva").order_by("-creado_en")


@transaction.atomic
def registrar_notificacion_reserva(reserva: Reserva) -> Notificacion | None:
    """Registra la notificación y despacha el correo de confirmación de reserva."""
    usuario = getattr(reserva.cliente, "usuario", None)
    if not usuario or not usuario.email:
        return None

    notif = Notificacion.objects.create(
        usuario=usuario,
        reserva=reserva,
        tipo=Notificacion.TIPO_CONFIRMACION,
        estado=Notificacion.ESTADO_PENDIENTE,
    )

    salida_fmt = reserva.salida.fecha_salida.strftime("%d/%m/%Y")
    paquete_nom = reserva.salida.paquete.nombre

    html = f"""
    <div style="font-family: serif; color: #231a13; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5dccb; border-radius: 12px; background: #faf5eb;">
      <h2 style="color: #792609; margin-bottom: 8px;">Illimani Global Travel</h2>
      <p style="font-size: 14px; text-transform: uppercase; color: #792609; font-weight: bold;">Confirmación de Reserva de Expedición</p>
      <p>Estimado/a <strong>{reserva.cliente.nombre_completo}</strong>,</p>
      <p>Su reserva ha sido registrada satisfactoriamente con el código oficial:</p>
      <div style="background: white; border: 1px dashed #792609; padding: 16px; text-align: center; font-size: 20px; font-weight: bold; color: #792609; margin: 16px 0; border-radius: 8px;">
        {reserva.codigo}
      </div>
      <p><strong>Expedición:</strong> {paquete_nom}</p>
      <p><strong>Fecha de salida:</strong> {salida_fmt}</p>
      <p><strong>Viajeros:</strong> {reserva.num_personas} persona(s)</p>
      <p><strong>Total estimado:</strong> {reserva.moneda} {reserva.total:.2f}</p>
      <p><strong>Estado:</strong> {reserva.get_estado_display()}</p>
      <hr style="border: none; border-top: 1px solid #e5dccb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">Illimani Global Travel S.R.L. · Expediciones de autor y naturaleza</p>
    </div>
    """

    exito = enviar(
        para=usuario.email,
        asunto=f"Confirmación de su reserva {reserva.codigo} — Illimani Global Travel",
        html=html,
        usuario=usuario,
        evento="confirmacion_reserva",
    )

    notif.estado = Notificacion.ESTADO_ENVIADA if exito else Notificacion.ESTADO_PENDIENTE
    notif.save(update_fields=["estado"])
    return notif


@transaction.atomic
def registrar_notificacion_itinerario(reserva: Reserva) -> Notificacion | None:
    """Envía la notificación con el itinerario detallado al cliente."""
    usuario = getattr(reserva.cliente, "usuario", None)
    if not usuario or not usuario.email:
        return None

    notif = Notificacion.objects.create(
        usuario=usuario,
        reserva=reserva,
        tipo=Notificacion.TIPO_ITINERARIO,
        estado=Notificacion.ESTADO_PENDIENTE,
    )

    html = f"""
    <div style="font-family: serif; color: #231a13; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5dccb; border-radius: 12px; background: #faf5eb;">
      <h2 style="color: #792609; margin-bottom: 8px;">Illimani Global Travel</h2>
      <p style="font-size: 14px; text-transform: uppercase; color: #792609; font-weight: bold;">Su Itinerario de Viaje está Listo</p>
      <p>Estimado/a <strong>{reserva.cliente.nombre_completo}</strong>,</p>
      <p>El itinerario cronológico de su viaje <strong>{reserva.codigo}</strong> ha sido preparado y se encuentra disponible en su portal de viajero.</p>
      <p>Consulte las actividades día a día, recomendaciones de viaje y horarios de vuelo ingresando a su cuenta.</p>
      <hr style="border: none; border-top: 1px solid #e5dccb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">Illimani Global Travel S.R.L.</p>
    </div>
    """

    exito = enviar(
        para=usuario.email,
        asunto=f"Itinerario de viaje disponible para {reserva.codigo} — Illimani Global Travel",
        html=html,
        usuario=usuario,
        evento="itinerario_listo",
    )

    notif.estado = Notificacion.ESTADO_ENVIADA if exito else Notificacion.ESTADO_PENDIENTE
    notif.save(update_fields=["estado"])
    return notif

