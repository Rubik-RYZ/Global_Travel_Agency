from __future__ import annotations

import logging

from django.conf import settings

from apps.notificaciones import plantillas

logger = logging.getLogger(__name__)

def correo_configurado() -> bool:
    return bool(getattr(settings, "RESEND_API_KEY", ""))

def _auditar(*, accion: str, usuario=None, detalle: dict | None = None) -> None:
    from apps.usuarios.services import registrar_auditoria

    registrar_auditoria(
        accion=accion,
        usuario=usuario,
        entidad="notificaciones",
        entidad_id=str(usuario.id) if usuario is not None else None,
        detalle=detalle,
    )

def enviar(
    *,
    para: str,
    asunto: str,
    html: str,
    texto: str | None = None,
    usuario=None,
    evento: str = "generico",
) -> bool:

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
    except Exception as exc:
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

def bienvenida_cliente(*, usuario, nombres: str) -> bool:
    return enviar(
        para=getattr(usuario, "email", ""),
        asunto="Bienvenido a Illimani Global Travel",
        html=plantillas.bienvenida(nombres=nombres),
        usuario=usuario,
        evento="bienvenida_cliente",
    )

def recuperacion_password(*, usuario, enlace: str) -> bool:
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
    return enviar(
        para=getattr(usuario, "email", ""),
        asunto="Su contraseña fue actualizada — Illimani Global Travel",
        html=plantillas.password_restablecido(),
        usuario=usuario,
        evento="password_restablecido",
    )

def ficha_viajero_abierta(*, cliente, usuario=None) -> bool:
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
