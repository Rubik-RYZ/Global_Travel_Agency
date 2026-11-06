"""Rutas del dominio de reservas e itinerarios (CU7 · CU8)."""
from rest_framework.routers import DefaultRouter

from apps.reservas.views import ItinerarioViewSet, NotificacionViewSet, ReservaViewSet

router = DefaultRouter()
router.register(r"reservas", ReservaViewSet, basename="reserva")
router.register(r"itinerarios", ItinerarioViewSet, basename="itinerario")
router.register(r"notificaciones", NotificacionViewSet, basename="notificacion")

urlpatterns = router.urls
