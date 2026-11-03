"""Registro de modelos del catálogo en el admin de Django."""
from django.contrib import admin

from apps.catalogo.models import (
    Aeropuerto,
    Destino,
    Hotel,
    ItinerarioDia,
    Paquete,
    PaqueteSalida,
    Proveedor,
    Vuelo,
)


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


@admin.register(Vuelo)
class VueloAdmin(admin.ModelAdmin):
    list_display = (
        "numero_vuelo", "proveedor", "origen", "destino",
        "salida", "llegada", "precio", "moneda", "cupos_disponibles",
    )
    list_filter = ("proveedor", "moneda")
    search_fields = ("numero_vuelo", "proveedor__nombre")
    date_hierarchy = "salida"


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ("nombre", "destino", "proveedor", "estrellas", "activo")
    list_filter = ("estrellas", "activo", "destino__pais")
    search_fields = ("nombre", "direccion", "proveedor__nombre", "destino__nombre")


class PaqueteSalidaInline(admin.TabularInline):
    model = PaqueteSalida
    extra = 1
    ordering = ("fecha_salida",)


@admin.register(Paquete)
class PaqueteAdmin(admin.ModelAdmin):
    list_display = (
        "nombre", "destino", "hotel", "duracion_dias",
        "precio_base", "moneda", "activo",
    )
    list_filter = ("activo", "moneda", "destino__pais")
    search_fields = ("nombre", "descripcion", "destino__nombre")
    inlines = [PaqueteSalidaInline]


@admin.register(PaqueteSalida)
class PaqueteSalidaAdmin(admin.ModelAdmin):
    list_display = (
        "paquete", "fecha_salida", "cupos_totales", "cupos_disponibles",
    )
    list_filter = ("paquete__destino__pais",)
    search_fields = ("paquete__nombre",)
    date_hierarchy = "fecha_salida"
