"""Modelos del dominio de reservas e itinerarios (CU7 · CU8).

Re-exporta todas las entidades para que Django las detecte correctamente.
"""
from apps.reservas.models.itinerario import Itinerario
from apps.reservas.models.itinerario_item import ItinerarioItem
from apps.reservas.models.notificacion import Notificacion
from apps.reservas.models.reserva import Reserva
from apps.reservas.models.reserva_pasajero import ReservaPasajero

__all__ = [
    "Itinerario",
    "ItinerarioItem",
    "Notificacion",
    "Reserva",
    "ReservaPasajero",
]
