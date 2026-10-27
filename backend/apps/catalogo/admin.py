"""Registro de modelos del catálogo en el admin de Django."""
from django.contrib import admin

from apps.catalogo.models import Aeropuerto, Destino, Proveedor


@admin.register(Destino)
class DestinoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "pais", "activo")
    list_filter = ("pais", "activo")
    search_fields = ("nombre", "pais", "descripcion")


@admin.register(Aeropuerto)
class AeropuertoAdmin(admin.ModelAdmin):
    list_display = ("codigo_iata", "nombre", "destino")
    list_filter = ("destino__pais",)
    search_fields = ("codigo_iata", "nombre")


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "activo")
    list_filter = ("tipo", "activo")
    search_fields = ("nombre",)
