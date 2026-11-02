"""Servicios del panel: equipo interno y accesos (CU1)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.usuarios.services.auditoria import ip_desde_request, registrar_auditoria

Usuario = get_user_model()


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
    # Retrato del miembro del equipo (opcional, Fase 3b).
    if datos.get("foto_url") is not None:
        usuario.foto_url = datos.get("foto_url")
        usuario.foto_public_id = datos.get("foto_public_id")
        usuario.save(update_fields=["foto_url", "foto_public_id"])
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
    if datos.get("foto_url") is not None:
        usuario.foto_url = datos.get("foto_url")
        usuario.foto_public_id = datos.get("foto_public_id")
        cambios["foto_url"] = usuario.foto_url
        cambios["foto_public_id"] = usuario.foto_public_id
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
def actualizar_foto_usuario(*, usuario, datos: dict, actor=None, request=None):
    """Guarda el retrato propio del usuario autenticado (opcional, Fase 3b).

    Lo usan el propio viajero desde «Mi viaje» y el personal desde el panel.
    La URL y el `public_id` se aceptan tal cual: la subida al almacén ya pasó
    por `apps.almacen`.
    """
    cambios: dict = {}
    for campo in ("foto_url", "foto_public_id"):
        if campo in datos:
            setattr(usuario, campo, datos[campo] or None)
            cambios[campo] = getattr(usuario, campo)
    if cambios:
        usuario.save(update_fields=list(cambios))
    registrar_auditoria(
        accion="usuario_foto_actualizada",
        usuario=actor or usuario,
        entidad="usuarios",
        entidad_id=usuario.id,
        detalle={"campos": sorted(cambios)},
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
