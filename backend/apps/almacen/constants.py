"""Carpetas del almacén externo (Cloudinary, Fase 3b).

Cada entidad sube sus archivos a su propia carpeta para que la Media Library
del proyecto quede ordenada sin que nadie tenga que hacerlo a mano. El valor
es la ruta dentro del almacén; la clave es el nombre corto que viaja por el
API (el frontend nunca escribe rutas).
"""

CARPETA_DESTINOS = "illimani/destinos"
CARPETA_PROVEEDORES = "illimani/proveedores"
CARPETA_PASAPORTES = "illimani/clientes/pasaportes"
CARPETA_CARNETS = "illimani/clientes/carnets"
CARPETA_EQUIPO = "illimani/equipo"

# clave del API -> ruta en el almacén
CARPETAS: dict[str, str] = {
    "destinos": CARPETA_DESTINOS,
    "proveedores": CARPETA_PROVEEDORES,
    "pasaportes": CARPETA_PASAPORTES,
    "carnets": CARPETA_CARNETS,
    "equipo": CARPETA_EQUIPO,
}

# Nombre legible de cada carpeta (se muestra en el panel).
ETIQUETAS_CARPETA: dict[str, str] = {
    "destinos": "Láminas de destinos",
    "proveedores": "Fichas de proveedores",
    "pasaportes": "Pasaportes de viajeros",
    "carnets": "Carnets de identidad",
    "equipo": "Retratos del equipo",
}
