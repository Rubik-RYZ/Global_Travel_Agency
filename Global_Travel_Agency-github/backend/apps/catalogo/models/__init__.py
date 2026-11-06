"""Capa de dominio del catálogo turístico (CU3 · destinos y proveedores).

Vuelos, hoteles, paquetes y salidas (CU4–CU6) se agregan en el Sprint 3 como
módulos nuevos dentro de este mismo paquete.

IMPORTANTE: re-exportar TODAS las entidades. Si se olvida una, Django la
considera eliminada y genera una migración que borra su tabla.
"""
from apps.catalogo.models.aeropuerto import Aeropuerto
from apps.catalogo.models.destino import Destino
from apps.catalogo.models.itinerario_dia import ItinerarioDia
from apps.catalogo.models.proveedor import Proveedor

__all__ = ["Aeropuerto", "Destino", "ItinerarioDia", "Proveedor"]
