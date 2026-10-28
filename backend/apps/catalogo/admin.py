"""Registro de modelos del catálogo en el admin de Django."""
from django.contrib import admin

from apps.catalogo.models import Aeropuerto, Destino, ItinerarioDia, Proveedor


class ItinerarioDiaInline(admin.TabularInline):
    model = ItinerarioDia
    extra = 1
    ordering = ("numero_dia",)


@admin.register(Destino)
class DestinoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "pais", "region", "caracter", "destacado", "activo")
    list_filter = ("pais", "region", "caracter", "destacado", "activo")
    search_fields = ("nombre", "pais", "resumen", "descripcion")
    prepopulated_fields = {"slug": ("nombre", "pais")}
    inlines = [ItinerarioDiaInline]


@admin.register(ItinerarioDia)
class ItinerarioDiaAdmin(admin.ModelAdmin):
    list_display = ("destino", "numero_dia", "titulo")
    list_filter = ("destino__pais",)
    search_fields = ("titulo", "descripcion", "ubicacion")


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
