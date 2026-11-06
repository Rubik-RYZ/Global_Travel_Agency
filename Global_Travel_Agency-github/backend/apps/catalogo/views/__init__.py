"""Capa de presentación del catálogo turístico (CU3). Re-exporta los ViewSets."""
from apps.catalogo.views.aeropuertos import AeropuertoViewSet
from apps.catalogo.views.destinos import DestinoViewSet
from apps.catalogo.views.proveedores import ProveedorViewSet

__all__ = ["AeropuertoViewSet", "DestinoViewSet", "ProveedorViewSet"]
