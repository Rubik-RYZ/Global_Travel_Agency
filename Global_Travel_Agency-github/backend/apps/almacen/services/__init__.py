"""Capa de negocio del almacén externo de archivos.

Re-exporta la API pública para que `from apps.almacen import services` siga
funcionando igual.
"""
from apps.almacen.services.archivos import (
    FORMATOS_IMAGEN,
    MAX_BYTES,
    TIPOS_IMAGEN,
    AlmacenNoConfigurado,
    almacen_configurado,
    eliminar_archivo,
    subir_imagen,
)

__all__ = [
    "FORMATOS_IMAGEN",
    "MAX_BYTES",
    "TIPOS_IMAGEN",
    "AlmacenNoConfigurado",
    "almacen_configurado",
    "eliminar_archivo",
    "subir_imagen",
]
