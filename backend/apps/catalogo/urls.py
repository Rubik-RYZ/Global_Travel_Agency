"""Rutas del dominio de catálogo (CU3–CU6)."""
from rest_framework.routers import DefaultRouter

from apps.catalogo.views import (
    AeropuertoViewSet,
    DestinoViewSet,
    HotelViewSet,
    PaqueteSalidaViewSet,
    PaqueteViewSet,
    ProveedorViewSet,
    VueloViewSet,
)

router = DefaultRouter()
router.register(r"destinos", DestinoViewSet, basename="destino")
router.register(r"aeropuertos", AeropuertoViewSet, basename="aeropuerto")
router.register(r"proveedores", ProveedorViewSet, basename="proveedor")
router.register(r"vuelos", VueloViewSet, basename="vuelo")
router.register(r"hoteles", HotelViewSet, basename="hotel")
router.register(r"paquetes", PaqueteViewSet, basename="paquete")
router.register(r"salidas", PaqueteSalidaViewSet, basename="salida")

urlpatterns = router.urls