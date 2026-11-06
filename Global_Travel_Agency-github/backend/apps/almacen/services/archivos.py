"""Subida y borrado de archivos en el almacén externo (Cloudinary).

Reglas de la casa:

* Si el entorno no tiene credenciales, el sistema **sigue funcionando**: las
  imágenes que ya están guardadas por URL se ven igual. Sólo la subida queda
  deshabilitada y se avisa con un mensaje claro (`AlmacenNoConfigurado`), nunca
  con un error 500.
* La URL y el `public_id` viajan siempre juntos: sin el `public_id` no se puede
  reemplazar ni borrar el archivo viejo cuando el usuario sube uno nuevo.
* La firma (API secret) vive **sólo en el servidor**; el navegador nunca la ve.
"""
from __future__ import annotations

import logging

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

MAX_BYTES = 8 * 1024 * 1024  # 8 MB
FORMATOS_IMAGEN = {"jpg", "jpeg", "png", "webp", "avif"}
TIPOS_IMAGEN = {"image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"}


class AlmacenNoConfigurado(RuntimeError):
    """El entorno no tiene credenciales del almacén externo."""


# --------------------------------------------------------------------------
# Estado
# --------------------------------------------------------------------------
def almacen_configurado() -> bool:
    """¿Están las tres credenciales del almacén en el entorno?"""
    return bool(
        getattr(settings, "CLOUDINARY_CLOUD_NAME", "")
        and getattr(settings, "CLOUDINARY_API_KEY", "")
        and getattr(settings, "CLOUDINARY_API_SECRET", "")
    )


def _configurar() -> None:
    if not almacen_configurado():
        raise AlmacenNoConfigurado(
            "El almacén externo no está configurado en este entorno."
        )
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
        overwrite=True,
    )


# --------------------------------------------------------------------------
# Validación
# --------------------------------------------------------------------------
def _validar_imagen(archivo) -> None:
    """Valida tamaño, extensión y tipo MIME antes de gastar cuota."""
    if archivo is None:
        raise ValidationError({"archivo": "Adjunte un archivo."})
    if not archivo.size:
        raise ValidationError({"archivo": "El archivo está vacío."})
    if archivo.size > MAX_BYTES:
        limite = MAX_BYTES // (1024 * 1024)
        raise ValidationError(
            {"archivo": f"El archivo supera el límite de {limite} MB."}
        )

    nombre = (getattr(archivo, "name", "") or "").strip()
    extension = nombre.rsplit(".", 1)[-1].lower() if "." in nombre else ""
    tipo = (getattr(archivo, "content_type", "") or "").lower()
    if extension not in FORMATOS_IMAGEN and tipo not in TIPOS_IMAGEN:
        raise ValidationError(
            {"archivo": "Formato no admitido. Use JPG, PNG, WEBP o AVIF."}
        )


# --------------------------------------------------------------------------
# Subida / borrado
# --------------------------------------------------------------------------
def subir_imagen(archivo, *, carpeta: str, public_id: str | None = None) -> dict:
    """Sube una imagen al almacén y devuelve `{url, public_id, ...}`.

    Lanza `ValidationError` si el archivo no es válido y `AlmacenNoConfigurado`
    si faltan credenciales (la vista las traduce a respuestas HTTP limpias).
    """
    _validar_imagen(archivo)
    _configurar()

    try:
        resultado = cloudinary.uploader.upload(
            archivo,
            folder=carpeta,
            public_id=public_id,
            resource_type="image",
            overwrite=True,
            invalidate=True,
            use_filename=True,
            unique_filename=True,
        )
    except CloudinaryError as exc:  # credenciales inválidas, cuota, red...
        logger.warning("Falló la subida al almacén: %s", exc)
        raise ValidationError(
            {"archivo": "No se pudo subir el archivo al almacén. Intente de nuevo."}
        ) from exc

    return {
        "url": resultado.get("secure_url") or resultado.get("url"),
        "public_id": resultado.get("public_id"),
        "formato": resultado.get("format"),
        "ancho": resultado.get("width"),
        "alto": resultado.get("height"),
        "bytes": resultado.get("bytes"),
        "carpeta": carpeta,
    }


def eliminar_archivo(public_id: str | None) -> bool:
    """Borra un archivo del almacén. Nunca interrumpe el flujo del llamador."""
    if not public_id or not almacen_configurado():
        return False
    try:
        _configurar()
        cloudinary.uploader.destroy(public_id, invalidate=True)
        return True
    except CloudinaryError as exc:
        logger.warning("No se pudo borrar %s del almacén: %s", public_id, exc)
        return False
