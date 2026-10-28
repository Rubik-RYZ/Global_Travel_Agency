"""Rutas del almacén externo de archivos (Fase 3b)."""
from django.urls import path

from apps.almacen.views import (
    EliminarArchivoView,
    EstadoAlmacenView,
    SubidaArchivoView,
)

urlpatterns = [
    path("almacen/estado/", EstadoAlmacenView.as_view(), name="almacen-estado"),
    path("almacen/subir/", SubidaArchivoView.as_view(), name="almacen-subir"),
    path("almacen/eliminar/", EliminarArchivoView.as_view(), name="almacen-eliminar"),
]
