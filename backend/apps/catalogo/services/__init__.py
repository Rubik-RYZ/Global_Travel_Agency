"""Capa de negocio del catálogo turístico (CU3). Re-exporta los servicios."""
from apps.catalogo.services.destinos import (
    CAMPOS_DESTINO,
    actualizar_destino,
    crear_destino,
    definir_itinerario,
    listar_destinos,
    obtener_destino,
    toggle_activo_destino,
)
from apps.catalogo.services.proveedores import (
    actualizar_proveedor,
    crear_proveedor,
    listar_proveedores,
    obtener_proveedor,
    toggle_activo_proveedor,
)

__all__ = [
    "CAMPOS_DESTINO",
    "actualizar_destino",
    "actualizar_proveedor",
    "crear_destino",
    "crear_proveedor",
    "definir_itinerario",
    "listar_destinos",
    "listar_proveedores",
    "obtener_destino",
    "obtener_proveedor",
    "toggle_activo_destino",
    "toggle_activo_proveedor",
]
