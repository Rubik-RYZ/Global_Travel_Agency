"""Capa de dominio del catálogo turístico (CU3, CU4, CU5, CU6).

IMPORTANTE: re-exportar TODAS las entidades. Si se olvida una, Django la
considera eliminada y genera una migración que borra su tabla.
"""
from apps.catalogo.models.aeropuerto import Aeropuerto
from apps.catalogo.models.destino import Destino
from apps.catalogo.models.habitacion import Habitacion
from apps.catalogo.models.hotel import Hotel
from apps.catalogo.models.itinerario_dia import ItinerarioDia
from apps.catalogo.models.paquete import Paquete
from apps.catalogo.models.paquete_salida import PaqueteSalida
from apps.catalogo.models.proveedor import Proveedor
from apps.catalogo.models.vuelo import Vuelo

__all__ = [
    "Aeropuerto",
    "Destino",
    "Habitacion",
    "Hotel",
    "ItinerarioDia",
    "Paquete",
    "PaqueteSalida",
    "Proveedor",
    "Vuelo",
]
