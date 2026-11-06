"""Capa de presentación del almacén externo de archivos.

Re-exporta las vistas para que `from apps.almacen.views import ...` siga
funcionando igual.
"""
from apps.almacen.views.archivos import (
    EliminarArchivoView,
    EstadoAlmacenView,
    SubidaArchivoView,
)

__all__ = [
    "EliminarArchivoView",
    "EstadoAlmacenView",
    "SubidaArchivoView",
]
