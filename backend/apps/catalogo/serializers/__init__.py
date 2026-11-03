"""Capa de esquema del catálogo turístico (CU3). Re-exporta los serializers."""
from apps.catalogo.serializers.aeropuerto import AeropuertoSerializer
from apps.catalogo.serializers.destino import (
    DestinoResumenSerializer,
    DestinoSerializer,
    ItinerarioDiaSerializer,
)
from apps.catalogo.serializers.proveedor import ProveedorSerializer
from apps.catalogo.serializers.vuelo import VueloSerializer
from apps.catalogo.serializers.hotel import HotelSerializer
from apps.catalogo.serializers.paquete import PaqueteSalidaSerializer, PaqueteSerializer

__all__ = [
    "AeropuertoSerializer",
    "DestinoResumenSerializer",
    "DestinoSerializer",
    "HotelSerializer",
    "ItinerarioDiaSerializer",
    "PaqueteSalidaSerializer",
    "PaqueteSerializer",
    "ProveedorSerializer",
    "VueloSerializer",
]
