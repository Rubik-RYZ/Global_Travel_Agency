"""Capa de presentación del catálogo turístico. Re-exporta los ViewSets."""
from apps.catalogo.views.aeropuertos import AeropuertoViewSet
from apps.catalogo.views.destinos import DestinoViewSet
from apps.catalogo.views.hoteles import HotelViewSet
from apps.catalogo.views.paquetes import PaqueteSalidaViewSet, PaqueteViewSet
from apps.catalogo.views.proveedores import ProveedorViewSet
from apps.catalogo.views.vuelos import VueloViewSet

__all__ = [
    "AeropuertoViewSet",
    "DestinoViewSet",
    "HotelViewSet",
    "PaqueteSalidaViewSet",
    "PaqueteViewSet",
    "ProveedorViewSet",
    "VueloViewSet",
]