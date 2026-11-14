from django.urls import path

from apps.reportes.views import ReporteOcupacionView, ReporteVentasView

urlpatterns = [
    path("reportes/ventas/", ReporteVentasView.as_view(), name="reportes-ventas"),
    path(
        "reportes/ocupacion/",
        ReporteOcupacionView.as_view(),
        name="reportes-ocupacion",
    ),
]
