"""Capa de esquema del catálogo turístico (CU3 · CU4). Re-exporta los serializers."""
from apps.catalogo.serializers.aeropuerto import AeropuertoSerializer
from apps.catalogo.serializers.destino import (
    DestinoResumenSerializer,
    DestinoSerializer,
    ItinerarioDiaSerializer,
)
from apps.catalogo.serializers.hotel import (
    HabitacionSerializer,
    HabitacionWriteSerializer,
    HotelDetailSerializer,
    HotelListSerializer,
    HotelWriteSerializer,
)
from apps.catalogo.serializers.paquete import (
    PaqueteDetailSerializer,
    PaqueteListSerializer,
    PaqueteSalidaSerializer,
    PaqueteSalidaWriteSerializer,
    PaqueteWriteSerializer,
)
from apps.catalogo.serializers.proveedor import ProveedorSerializer
from apps.catalogo.serializers.vuelo import (
    VueloDetailSerializer,
    VueloListSerializer,
    VueloWriteSerializer,
)

__all__ = [
    "AeropuertoSerializer",
    "DestinoResumenSerializer",
    "DestinoSerializer",
    "HabitacionSerializer",
    "HabitacionWriteSerializer",
    "HotelDetailSerializer",
    "HotelListSerializer",
    "HotelWriteSerializer",
    "ItinerarioDiaSerializer",
    "PaqueteDetailSerializer",
    "PaqueteListSerializer",
    "PaqueteSalidaSerializer",
    "PaqueteSalidaWriteSerializer",
    "PaqueteWriteSerializer",
    "ProveedorSerializer",
    "VueloDetailSerializer",
    "VueloListSerializer",
    "VueloWriteSerializer",
]
