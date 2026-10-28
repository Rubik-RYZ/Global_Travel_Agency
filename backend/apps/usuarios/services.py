"""Capa de negocio de CU1 · Seguridad y acceso.

Toda la lógica del dominio vive aquí: autenticación, registro de clientes,
recuperación de contraseña y bitácora de auditoría. Los ViewSets solo
orquestan (regla de capas de AGENT.md).

Nota: el envío de emails es síncrono (Resend en producción, consola en dev).
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import ProtectedError
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.usuarios.constants import ROL_CLIENTE
from apps.usuarios.models import Auditoria, Cliente, ClientePreferencia

Usuario = get_user_model()
logger = logging.getLogger(__name__)

SALT_RECUPERACION = "illimani.recuperar-password"
TOKEN_RECUPERACION_MAX_AGE = 60 * 60 * 2  # 2 horas


# ---------------------------------------------------------------------
# Utilidades transversales
# ---------------------------------------------------------------------
def ip_desde_request(request) -> str | None:
    """Obtiene la IP del cliente (soporta proxy vía X-Forwarded-For)."""
    if request is None:
        return None
    reenviada = request.META.get("HTTP_X_FORWARDED_FOR")
    if reenviada:
        return reenviada.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def registrar_auditoria(
    *,
    accion: str,
    usuario=None,
    entidad: str | None = None,
    entidad_id: str | int | None = None,
    detalle: dict | None = None,
    ip: str | None = None,
) -> Auditoria:
    """Inserta una entrada en la bitácora de seguridad."""
    return Auditoria.objects.create(
        usuario=usuario,
        accion=accion,
        entidad=entidad,
        entidad_id=None if entidad_id is None else str(entidad_id),
        detalle=detalle,
        ip=ip,
    )


def generar_tokens(usuario) -> dict[str, str]:
    """Emite el par de tokens JWT incluyendo email y rol como claims."""
    refresh = RefreshToken.for_user(usuario)
    refresh["email"] = usuario.email
    refresh["rol"] = usuario.rol.nombre
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


# ---------------------------------------------------------------------
# Autenticación
# ---------------------------------------------------------------------
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


# ---------------------------------------------------------------------
# Registro
# ---------------------------------------------------------------------
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
    return usuario, cliente


# ---------------------------------------------------------------------
# Recuperación de contraseña (token firmado, sin tabla extra)
# ---------------------------------------------------------------------
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

    send_mail(
        subject="Restablece tu contraseña — Illimani Global Travel",
        message=(
            "Recibimos una solicitud para restablecer tu contraseña.\n\n"
            f"Abre este enlace (válido por 2 horas):\n{enlace}\n\n"
            "Si no solicitaste este cambio, ignora este mensaje."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        fail_silently=True,
    )
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
    return usuario


# ---------------------------------------------------------------------
# Panel · equipo y accesos
# ---------------------------------------------------------------------
@transaction.atomic
def crear_usuario_equipo(*, datos: dict, actor=None, request=None):
    """Alta de un usuario interno (administrador/agente) desde el panel."""
    email = (datos.get("email") or "").strip().lower()
    if Usuario.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": "Ya existe un usuario con este email."})

    usuario = Usuario.objects.create_user(
        email=email,
        password=datos["password"],
        rol_id=datos["rol_id"],
        activo=datos.get("activo", True),
    )
    registrar_auditoria(
        accion="usuario_creado",
        usuario=actor,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"email": email, "rol_id": datos["rol_id"]},
        ip=ip_desde_request(request),
    )
    return usuario


@transaction.atomic
def actualizar_usuario_equipo(*, usuario, datos: dict, actor=None, request=None):
    """Actualiza rol/estado y, opcionalmente, la contraseña de un usuario."""
    cambios: dict = {}
    if datos.get("rol_id") is not None:
        usuario.rol_id = datos["rol_id"]
        cambios["rol_id"] = datos["rol_id"]
    if datos.get("activo") is not None:
        usuario.activo = datos["activo"]
        cambios["activo"] = datos["activo"]
    if cambios:
        usuario.save(update_fields=list(cambios))
    if datos.get("password"):
        usuario.set_password(datos["password"])
        usuario.save(update_fields=["password"])

    registrar_auditoria(
        accion="usuario_actualizado",
        usuario=actor,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"campos": sorted(datos.keys())},
        ip=ip_desde_request(request),
    )
    return usuario


@transaction.atomic
def desactivar_usuario_equipo(*, usuario, actor=None, request=None) -> None:
    """Baja lógica: conserva el histórico de auditoría (no borra la fila)."""
    usuario.activo = False
    usuario.save(update_fields=["activo"])
    registrar_auditoria(
        accion="usuario_desactivado",
        usuario=actor,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"email": usuario.email},
        ip=ip_desde_request(request),
    )


# ---------------------------------------------------------------------
# CU2 · Clientes y preferencias
# ---------------------------------------------------------------------
CAMPOS_CLIENTE = [
    "nombres",
    "apellidos",
    "documento_tipo",
    "documento_numero",
    "telefono",
    "fecha_nacimiento",
    "pais_origen",
]


def cliente_de_usuario(usuario) -> Cliente | None:
    """Ficha de viajero asociada a un usuario, o None."""
    if usuario is None:
        return None
    return Cliente.objects.filter(usuario=usuario).first()


def obtener_o_crear_cliente(*, usuario) -> Cliente:
    """Devuelve la ficha de viajero del usuario; la crea si aún no existe.

    Cubre el caso de cuentas creadas sin ficha (p. ej. altas antiguas) para
    que «Mi viaje» siempre tenga un registro que mostrar y editar.
    """
    cliente = cliente_de_usuario(usuario)
    if cliente is not None:
        return cliente
    base = (getattr(usuario, "email", "") or "").split("@")[0] or "Viajero"
    return Cliente.objects.create(usuario=usuario, nombres=base, apellidos="")


@transaction.atomic
def crear_cliente(*, datos: dict, actor=None, request=None) -> Cliente:
    """Alta de un viajero desde el panel (puede no tener cuenta de usuario)."""
    cliente = Cliente.objects.create(
        **{campo: datos.get(campo) for campo in CAMPOS_CLIENTE if campo in datos}
    )
    registrar_auditoria(
        accion="cliente_creado",
        usuario=actor,
        entidad="clientes",
        entidad_id=cliente.id,
        detalle={"nombre_completo": cliente.nombre_completo},
        ip=ip_desde_request(request),
    )
    return cliente


@transaction.atomic
def actualizar_cliente(
    *,
    cliente: Cliente,
    datos: dict,
    actor=None,
    request=None,
    accion: str = "cliente_actualizado",
) -> Cliente:
    """Actualiza los datos personales del viajero (panel o «Mi viaje»)."""
    cambios = [campo for campo in CAMPOS_CLIENTE if campo in datos]
    for campo in cambios:
        setattr(cliente, campo, datos[campo])
    if cambios:
        cliente.save(update_fields=cambios)
    registrar_auditoria(
        accion=accion,
        usuario=actor,
        entidad="clientes",
        entidad_id=cliente.id,
        detalle={"campos": sorted(cambios)},
        ip=ip_desde_request(request),
    )
    return cliente


@transaction.atomic
def eliminar_cliente(*, cliente: Cliente, actor=None, request=None) -> None:
    """Baja de un viajero desde el panel.

    Se bloquea si el viajero tiene registros dependientes (reservas, etc.),
    para no romper la integridad referencial del histórico.
    """
    entidad_id = cliente.id
    detalle = {"nombre_completo": cliente.nombre_completo}
    try:
        cliente.delete()
    except ProtectedError as exc:
        raise ValidationError(
            {
                "detail": (
                    "No se puede eliminar: el viajero tiene reservas u otros "
                    "registros asociados."
                )
            }
        ) from exc
    registrar_auditoria(
        accion="cliente_eliminado",
        usuario=actor,
        entidad="clientes",
        entidad_id=entidad_id,
        detalle=detalle,
        ip=ip_desde_request(request),
    )


def obtener_preferencias(*, cliente: Cliente) -> ClientePreferencia:
    """Preferencias del viajero; se crean vacías la primera vez."""
    preferencias, _ = ClientePreferencia.objects.get_or_create(cliente=cliente)
    return preferencias


@transaction.atomic
def actualizar_preferencias_cliente(
    *, cliente: Cliente, datos: dict, actor=None, request=None
) -> ClientePreferencia:
    """Guarda presupuesto, moneda e intereses del viajero."""
    preferencias = obtener_preferencias(cliente=cliente)
    cambios = [campo for campo in ("presupuesto_max", "moneda", "intereses") if campo in datos]
    for campo in cambios:
        setattr(preferencias, campo, datos[campo])
    if cambios:
        preferencias.save(update_fields=[*cambios, "actualizado_en"])
    registrar_auditoria(
        accion="preferencias_actualizadas",
        usuario=actor,
        entidad="cliente_preferencias",
        entidad_id=cliente.id,
        detalle={"campos": sorted(cambios)},
        ip=ip_desde_request(request),
    )
    return preferencias
