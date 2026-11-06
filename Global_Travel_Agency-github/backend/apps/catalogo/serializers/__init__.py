"""Capa de esquema del catálogo turístico (CU3). Re-exporta los serializers."""
from apps.catalogo.serializers.aeropuerto import AeropuertoSerializer
from apps.catalogo.serializers.destino import (
    DestinoResumenSerializer,
    DestinoSerializer,
    ItinerarioDiaSerializer,
)
from apps.catalogo.serializers.proveedor import ProveedorSerializer

__all__ = [
    "AeropuertoSerializer",
    "DestinoResumenSerializer",
    "DestinoSerializer",
    "ItinerarioDiaSerializer",
    "ProveedorSerializer",
]
