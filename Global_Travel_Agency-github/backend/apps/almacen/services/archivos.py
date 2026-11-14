from __future__ import annotations

import logging

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

MAX_BYTES = 8 * 1024 * 1024
FORMATOS_IMAGEN = {"jpg", "jpeg", "png", "webp", "avif"}
TIPOS_IMAGEN = {"image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"}

class AlmacenNoConfigurado(RuntimeError):
    pass

def almacen_configurado() -> bool:
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

def _validar_imagen(archivo) -> None:
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

def subir_imagen(archivo, *, carpeta: str, public_id: str | None = None) -> dict:
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
    except CloudinaryError as exc:
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
    if not public_id or not almacen_configurado():
        return False
    try:
        _configurar()
        cloudinary.uploader.destroy(public_id, invalidate=True)
        return True
    except CloudinaryError as exc:
        logger.warning("No se pudo borrar %s del almacén: %s", public_id, exc)
        return False
