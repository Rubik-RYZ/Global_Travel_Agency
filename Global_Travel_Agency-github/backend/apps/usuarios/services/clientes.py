"""Servicios de clientes y preferencias (CU2)."""
from __future__ import annotations

from django.db import transaction
from django.db.models import ProtectedError
from rest_framework.exceptions import ValidationError

from apps.notificaciones import services as notificaciones
from apps.usuarios.models import Cliente, ClientePreferencia
from apps.usuarios.services.auditoria import ip_desde_request, registrar_auditoria

CAMPOS_CLIENTE = [
    "nombres",
    "apellidos",
    "documento_tipo",
    "documento_numero",
    "telefono",
    "fecha_nacimiento",
    "pais_origen",
    # Documentos digitalizados: URL + identificador del almacén.
    "pasaporte_url",
    "pasaporte_public_id",
    "carnet_url",
    "carnet_public_id",
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
    if cliente.usuario_id:
        notificaciones.ficha_viajero_abierta(cliente=cliente, usuario=cliente.usuario)
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
