"""Servicios de acceso: autenticación, registro y recuperación (CU1).

El envío de emails sale por la API de Resend cuando hay credenciales
(Fase 3b); si no las hay, se registra en la bitácora y se imprime en el log.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.db import transaction
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notificaciones import services as notificaciones
from apps.usuarios.constants import ROL_CLIENTE
from apps.usuarios.models import Cliente
from apps.usuarios.services.auditoria import ip_desde_request, registrar_auditoria

Usuario = get_user_model()
logger = logging.getLogger(__name__)

SALT_RECUPERACION = "illimani.recuperar-password"
TOKEN_RECUPERACION_MAX_AGE = 60 * 60 * 2  # 2 horas


def generar_tokens(usuario) -> dict[str, str]:
    """Emite el par de tokens JWT incluyendo email y rol como claims."""
    refresh = RefreshToken.for_user(usuario)
    refresh["email"] = usuario.email
    refresh["rol"] = usuario.rol.nombre
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def autenticar(*, email: str, password: str, request=None):
    """Autentica por email y contraseña.

    Registra en auditoría tanto el acceso exitoso como los intentos fallidos
    (AGENT.md: sin Redis ni cache externo).
    """
    email_normalizado = (email or "").strip().lower()
    ip = ip_desde_request(request)

    usuario = authenticate(
        request=request, username=email_normalizado, password=password
    )

    if usuario is None:
        registrado = Usuario.objects.filter(email__iexact=email_normalizado).first()
        registrar_auditoria(
            accion="login_fallido",
            usuario=registrado,
            entidad="usuarios",
            entidad_id=getattr(registrado, "id", None),
            detalle={"email": email_normalizado},
            ip=ip,
        )
        raise AuthenticationFailed("Credenciales inválidas.")

    usuario.registrar_acceso()
    tokens = generar_tokens(usuario)
    registrar_auditoria(
        accion="login",
        usuario=usuario,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"email": usuario.email},
        ip=ip,
    )
    return usuario, tokens


def cerrar_sesion(*, usuario, refresh_token: str | None, request=None) -> None:
    """Invalida el refresh token (blacklist) y deja constancia en auditoría."""
    if refresh_token:
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:  # noqa: BLE001 — token inválido/expirado: sesión ya cerrada
            logger.debug("Refresh token inválido al cerrar sesión.")
    registrar_auditoria(
        accion="logout",
        usuario=usuario,
        entidad="usuarios",
        entidad_id=getattr(usuario, "id", None),
        ip=ip_desde_request(request),
    )


@transaction.atomic
def registrar_cliente(
    *, email: str, password: str, nombres: str, apellidos: str, request=None
):
    """Da de alta un usuario cliente + su ficha de viajero."""
    email_normalizado = (email or "").strip().lower()

    if Usuario.objects.filter(email__iexact=email_normalizado).exists():
        raise ValidationError({"email": "Ya existe una cuenta con este email."})

    usuario = Usuario.objects.create_user(
        email=email_normalizado, password=password, rol_id=ROL_CLIENTE
    )
    cliente = Cliente.objects.create(
        usuario=usuario, nombres=nombres.strip(), apellidos=apellidos.strip()
    )
    registrar_auditoria(
        accion="registro_cliente",
        usuario=usuario,
        entidad="clientes",
        entidad_id=cliente.id,
        detalle={"email": email_normalizado},
        ip=ip_desde_request(request),
    )
    notificaciones.bienvenida_cliente(usuario=usuario, nombres=nombres.strip())
    return usuario, cliente


def solicitar_recuperacion(*, email: str, request=None) -> None:
    """Envía el enlace de restablecimiento si la cuenta existe.

    La respuesta es siempre la misma para no revelar qué emails están
    registrados; el intento se registra en auditoría.
    """
    email_normalizado = (email or "").strip().lower()
    ip = ip_desde_request(request)
    usuario = Usuario.objects.filter(email__iexact=email_normalizado, activo=True).first()

    if usuario is None:
        registrar_auditoria(
            accion="recuperar_solicitado",
            detalle={"email": email_normalizado, "encontrado": False},
            ip=ip,
        )
        return

    token = signing.dumps({"uid": usuario.id}, salt=SALT_RECUPERACION)
    enlace = f"{settings.FRONTEND_URL}/restablecer?token={token}"

    notificaciones.recuperacion_password(usuario=usuario, enlace=enlace)
    registrar_auditoria(
        accion="recuperar_solicitado",
        usuario=usuario,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"email": email_normalizado, "encontrado": True},
        ip=ip,
    )


@transaction.atomic
def restablecer_password(*, token: str, password: str, request=None):
    """Valida el token firmado y actualiza la contraseña."""
    try:
        datos = signing.loads(
            token, salt=SALT_RECUPERACION, max_age=TOKEN_RECUPERACION_MAX_AGE
        )
    except signing.SignatureExpired:
        raise ValidationError({"token": "El enlace expiró. Solicita uno nuevo."})
    except signing.BadSignature:
        raise ValidationError({"token": "El enlace no es válido."})

    usuario = Usuario.objects.filter(id=datos.get("uid"), activo=True).first()
    if usuario is None:
        raise ValidationError({"token": "El enlace no es válido."})

    usuario.set_password(password)
    usuario.save(update_fields=["password"])
    registrar_auditoria(
        accion="password_restablecido",
        usuario=usuario,
        entidad="usuarios",
        entidad_id=usuario.id,
        ip=ip_desde_request(request),
    )
    notificaciones.password_restablecido(usuario=usuario)
    return usuario
