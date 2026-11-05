"""Capa de presentación del catálogo turístico (CU3 · CU4 · CU5 · CU6). Re-exporta los ViewSets."""
from apps.catalogo.views.aeropuertos import AeropuertoViewSet
from apps.catalogo.views.destinos import DestinoViewSet
from apps.catalogo.views.hoteles import HabitacionViewSet, HotelViewSet
from apps.catalogo.views.paquetes import PaqueteSalidaViewSet, PaqueteViewSet
from apps.catalogo.views.proveedores import ProveedorViewSet
from apps.catalogo.views.vuelos import VueloViewSet

__all__ = [
    "AeropuertoViewSet",
    "DestinoViewSet",
    "HabitacionViewSet",
    "HotelViewSet",
    "PaqueteSalidaViewSet",
    "PaqueteViewSet",
    "ProveedorViewSet",
    "VueloViewSet",
]
