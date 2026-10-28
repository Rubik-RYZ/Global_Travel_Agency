"""Capa de dominio del catálogo turístico (CU3 · destinos y proveedores).

Vuelos, hoteles, paquetes y salidas (CU4–CU6) se agregan en el Sprint 3.
Las FK entre apps se declaran como string.
"""
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.utils.text import slugify

from apps.catalogo.constants import CARACTERES_VIAJE, REGIONES, TIPOS_PROVEEDOR


class Destino(models.Model):
    """Destino turístico internacional listo para vender (con coordenadas).

    Además de la ficha geográfica, un destino de agencia guarda los atributos
    comerciales que se muestran en el catálogo: duración sugerida, precio
    "desde", mejor época, carácter del viaje, imagen principal e inclusiones.
    """

    nombre = models.TextField()
    pais = models.TextField()
    # Código ISO 3166-1 alfa-2 (p. ej. "PE", "BO"); útil para filtros y reportes.
    pais_codigo = models.CharField(max_length=2, null=True, blank=True)
    slug = models.SlugField(max_length=140, unique=True, null=True, blank=True)
    region = models.TextField(choices=REGIONES, null=True, blank=True)
    resumen = models.TextField(null=True, blank=True)
    # Titular editorial de la ficha (el "lema" que encabeza el cuaderno de ruta).
    lema = models.TextField(null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)

    latitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    duracion_dias = models.PositiveSmallIntegerField(null=True, blank=True)
    duracion_noches = models.PositiveSmallIntegerField(null=True, blank=True)
    precio_desde = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    moneda = models.CharField(max_length=3, default="USD")
    mejor_epoca = models.TextField(null=True, blank=True)
    caracter = models.TextField(choices=CARACTERES_VIAJE, null=True, blank=True)

    # URL de la imagen principal (ruta local `/assets/...` o URL del almacén).
    imagen_principal = models.TextField(null=True, blank=True)
    # Identificador en el almacén externo: sin él no se puede reemplazar ni
    # borrar la lámina anterior cuando se sube otra (Fase 3b).
    imagen_public_id = models.TextField(null=True, blank=True)
    incluye = ArrayField(models.TextField(), default=list, blank=True)
    no_incluye = ArrayField(models.TextField(), default=list, blank=True)
    etiquetas = ArrayField(models.TextField(), default=list, blank=True)
    # Marca de "destino destacado" para el mega-menú y la landing.
    destacado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "destinos"
        verbose_name = "Destino"
        verbose_name_plural = "Destinos"
        constraints = [
            models.UniqueConstraint(
                fields=["nombre", "pais"], name="ux_destinos_nombre_pais"
            ),
            models.CheckConstraint(
                check=models.Q(latitud__gte=-90, latitud__lte=90)
                | models.Q(latitud__isnull=True),
                name="ck_destinos_latitud",
            ),
            models.CheckConstraint(
                check=models.Q(longitud__gte=-180, longitud__lte=180)
                | models.Q(longitud__isnull=True),
                name="ck_destinos_longitud",
            ),
            models.CheckConstraint(
                check=models.Q(precio_desde__gte=0)
                | models.Q(precio_desde__isnull=True),
                name="ck_destinos_precio_desde",
            ),
            models.CheckConstraint(
                check=models.Q(duracion_dias__gt=0)
                | models.Q(duracion_dias__isnull=True),
                name="ck_destinos_duracion_dias",
            ),
        ]
        indexes = [
            GinIndex(fields=["etiquetas"], name="ix_destinos_etiquetas"),
            models.Index(fields=["region"], name="ix_destinos_region"),
            models.Index(fields=["caracter"], name="ix_destinos_caracter"),
            models.Index(fields=["destacado"], name="ix_destinos_destacado"),
        ]

    def save(self, *args, **kwargs):
        # Campos que normalizamos aquí y que Django podría omitir si la llamada
        # trae `update_fields` (p. ej. `update_or_create`): los añadimos.
        derivados: set[str] = set()

        if not self.slug:
            self.slug = self._generar_slug()
            derivados.add("slug")

        if self.pais_codigo:
            normalizado = self.pais_codigo.strip().upper()
            if normalizado != self.pais_codigo:
                self.pais_codigo = normalizado
                derivados.add("pais_codigo")

        if self.moneda:
            normalizado = self.moneda.strip().upper()
            if normalizado != self.moneda:
                self.moneda = normalizado
                derivados.add("moneda")

        update_fields = kwargs.get("update_fields")
        if update_fields is not None and derivados:
            kwargs["update_fields"] = set(update_fields) | derivados

        super().save(*args, **kwargs)

    def _generar_slug(self) -> str:
        base = slugify(f"{self.nombre}-{self.pais}")[:120] or "destino"
        slug = base
        correlativo = 2
        while (
            Destino.objects.filter(slug=slug)
            .exclude(pk=self.pk)
            .exists()
        ):
            slug = f"{base}-{correlativo}"
            correlativo += 1
        return slug

    def __str__(self):
        return f"{self.nombre}, {self.pais}"


class ItinerarioDia(models.Model):
    """Un día del itinerario de un destino (diario de ruta día a día)."""

    destino = models.ForeignKey(
        Destino,
        on_delete=models.CASCADE,
        related_name="itinerario",
        db_column="destino_id",
    )
    numero_dia = models.PositiveSmallIntegerField()
    titulo = models.TextField()
    descripcion = models.TextField(null=True, blank=True)
    ubicacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "itinerario_dias"
        verbose_name = "Día de itinerario"
        verbose_name_plural = "Días de itinerario"
        ordering = ["numero_dia"]
        constraints = [
            models.UniqueConstraint(
                fields=["destino", "numero_dia"],
                name="ux_itinerario_destino_dia",
            ),
            models.CheckConstraint(
                check=models.Q(numero_dia__gt=0),
                name="ck_itinerario_numero_dia",
            ),
        ]

    def __str__(self):
        return f"Día {self.numero_dia} · {self.titulo}"


class Aeropuerto(models.Model):
    """Aeropuerto identificado por su código IATA."""

    codigo_iata = models.CharField(max_length=3, primary_key=True)
    nombre = models.TextField()
    destino = models.ForeignKey(
        "catalogo.Destino", on_delete=models.PROTECT, db_column="destino_id"
    )

    class Meta:
        db_table = "aeropuertos"
        verbose_name = "Aeropuerto"
        verbose_name_plural = "Aeropuertos"

    def __str__(self):
        return f"{self.codigo_iata} · {self.nombre}"


class Proveedor(models.Model):
    """Proveedor de servicios (aerolínea, hotel, transporte, operador)."""

    nombre = models.TextField(unique=True)
    tipo = models.TextField(choices=TIPOS_PROVEEDOR)
    pais = models.TextField(null=True, blank=True)
    ciudad = models.TextField(null=True, blank=True)
    contacto = models.TextField(null=True, blank=True)
    email = models.TextField(null=True, blank=True)
    telefono = models.TextField(null=True, blank=True)
    notas = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "proveedores"
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        indexes = [models.Index(fields=["tipo"], name="ix_proveedores_tipo")]

    def __str__(self):
        return self.nombre
