from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.utils.text import slugify

from apps.catalogo.constants import CARACTERES_VIAJE, REGIONES

class Destino(models.Model):
    nombre = models.TextField()
    pais = models.TextField()

    pais_codigo = models.CharField(max_length=2, null=True, blank=True)
    slug = models.SlugField(max_length=140, unique=True, null=True, blank=True)
    region = models.TextField(choices=REGIONES, null=True, blank=True)
    resumen = models.TextField(null=True, blank=True)

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

    imagen_principal = models.TextField(null=True, blank=True)

    imagen_public_id = models.TextField(null=True, blank=True)
    incluye = ArrayField(models.TextField(), default=list, blank=True)
    no_incluye = ArrayField(models.TextField(), default=list, blank=True)
    etiquetas = ArrayField(models.TextField(), default=list, blank=True)

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
