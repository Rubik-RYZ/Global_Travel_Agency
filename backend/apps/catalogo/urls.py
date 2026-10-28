"""Rutas del dominio de catálogo (CU3)."""
from rest_framework.routers import DefaultRouter

from apps.catalogo.views import AeropuertoViewSet, DestinoViewSet, ProveedorViewSet

router = DefaultRouter()
router.register(r"destinos", DestinoViewSet, basename="destino")
router.register(r"aeropuertos", AeropuertoViewSet, basename="aeropuerto")
router.register(r"proveedores", ProveedorViewSet, basename="proveedor")

urlpatterns = router.urls
