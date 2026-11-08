"""Rutas del dominio de pagos (CU9)."""
from django.urls import path

from apps.pagos.views import (
    BoletaPDFView,
    PagoClienteView,
    PagoListView,
    VentaVentanillaView,
)

urlpatterns = [
    path("pagos/", PagoListView.as_view(), name="pagos-list"),
    path("pagos/ventanilla/", VentaVentanillaView.as_view(), name="pago-ventanilla"),
    path("pagos/cliente/", PagoClienteView.as_view(), name="pago-cliente"),
    path("pagos/boleta/<int:reserva_id>/", BoletaPDFView.as_view(), name="pago-boleta"),
]
