"""Envío de correo transaccional (Fase 3b).

Reglas de la casa:

* Si el entorno tiene `RESEND_API_KEY`, los correos salen por la API de Resend.
* Si no la tiene, el sistema **sigue funcionando**: el correo se imprime en el
  log del servidor (útil en desarrollo y en demos sin conectividad) y se anota
  como omitido en la bitácora. Nunca se lanza un error 500 al usuario.
* Cada envío queda registrado en `Auditoria` para poder rastrearlo.
"""
from __future__ import annotations

import logging

from django.conf import settings

from apps.notificaciones import plantillas

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------
# Estado
# ---------------------------------------------------------------------
def correo_configurado() -> bool:
    """¿Hay clave de Resend en el entorno?"""
    return bool(getattr(settings, "RESEND_API_KEY", ""))


# ---------------------------------------------------------------------
# Auditoría
# ---------------------------------------------------------------------
def _auditar(*, accion: str, usuario=None, detalle: dict | None = None) -> None:
    """Import diferido: `usuarios.services` importa este módulo."""
    from apps.usuarios.services import registrar_auditoria

    registrar_auditoria(
        accion=accion,
        usuario=usuario,
        entidad="notificaciones",
        entidad_id=str(usuario.id) if usuario is not None else None,
        detalle=detalle,
    )


# ---------------------------------------------------------------------
# Envío base
# ---------------------------------------------------------------------
def enviar(
    *,
    para: str,
    asunto: str,
    html: str,
    texto: str | None = None,
    usuario=None,
    evento: str = "generico",
) -> bool:
    """Envía (o registra) un correo y devuelve si salió por la red."""
    destinatario = (para or "").strip()
    if not destinatario:
        return False

    remitente = settings.DEFAULT_FROM_EMAIL

    if not correo_configurado():
        logger.info(
            "[correo:consola] para=%s asunto=%r (sin RESEND_API_KEY: no se envía)",
            destinatario,
            asunto,
        )
        _auditar(
            accion="correo_omitido",
            usuario=usuario,
            detalle={"evento": evento, "para": destinatario, "motivo": "sin_clave"},
        )
        return False

    try:
        import resend

        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send(
            {
                "from": remitente,
                "to": [destinatario],
                "subject": asunto,
                "html": html,
                **({"text": texto} if texto else {}),
            }
        )
    except Exception as exc:  # red, cuota, remitente no verificado...
        logger.warning("No se pudo enviar «%s» a %s: %s", asunto, destinatario, exc)
        _auditar(
            accion="correo_fallido",
            usuario=usuario,
            detalle={"evento": evento, "para": destinatario, "error": str(exc)[:300]},
        )
        return False

    _auditar(
        accion="correo_enviado",
        usuario=usuario,
        detalle={"evento": evento, "para": destinatario},
    )
    return True


# ---------------------------------------------------------------------
# Eventos del sistema
# ---------------------------------------------------------------------
def bienvenida_cliente(*, usuario, nombres: str) -> bool:
    """Alta de una cuenta de viajero desde el formulario público."""
    return enviar(
        para=getattr(usuario, "email", ""),
        asunto="Bienvenido a Illimani Global Travel",
        html=plantillas.bienvenida(nombres=nombres),
        usuario=usuario,
        evento="bienvenida_cliente",
    )


def recuperacion_password(*, usuario, enlace: str) -> bool:
    """Solicitud de restablecimiento de contraseña."""
    return enviar(
        para=getattr(usuario, "email", ""),
        asunto="Restablezca su contraseña — Illimani Global Travel",
        html=plantillas.recuperacion(enlace=enlace),
        texto=(
            "Recibimos una solicitud para restablecer su contraseña.\n\n"
            f"Abra este enlace (válido por 2 horas):\n{enlace}\n\n"
            "Si no solicitó este cambio, ignore este mensaje."
        ),
        usuario=usuario,
        evento="recuperacion_password",
    )


def password_restablecido(*, usuario) -> bool:
    """Confirmación de que la contraseña cambió."""
    return enviar(
        para=getattr(usuario, "email", ""),
        asunto="Su contraseña fue actualizada — Illimani Global Travel",
        html=plantillas.password_restablecido(),
        usuario=usuario,
        evento="password_restablecido",
    )


def ficha_viajero_abierta(*, cliente, usuario=None) -> bool:
    """El personal abre la ficha de un viajero desde el panel."""
    correo = getattr(usuario, "email", None) if usuario else None
    if not correo:
        return False
    return enviar(
        para=correo,
        asunto="Su ficha de viajero quedó registrada",
        html=plantillas.ficha_viajero_abierta(
            nombre_completo=cliente.nombre_completo,
            numero_documento=cliente.documento_numero,
        ),
        usuario=usuario,
        evento="ficha_viajero_abierta",
    )
