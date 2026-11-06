"""Servicios de auditoría: utilidades transversales de la bitácora (CU1)."""
from __future__ import annotations

from apps.usuarios.models import Auditoria


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
