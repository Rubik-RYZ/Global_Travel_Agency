"""Capa de presentacion del dominio de pagos (CU9)."""
from apps.pagos.views.pagos import (
    BoletaPDFView,
    PagoClienteView,
    PagoListView,
    VentaVentanillaView,
)

__all__ = ["BoletaPDFView", "PagoClienteView", "PagoListView", "VentaVentanillaView"]
