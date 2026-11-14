CARPETA_DESTINOS = "illimani/destinos"
CARPETA_PROVEEDORES = "illimani/proveedores"
CARPETA_PASAPORTES = "illimani/clientes/pasaportes"
CARPETA_CARNETS = "illimani/clientes/carnets"
CARPETA_PERFILES = "illimani/clientes/perfiles"
CARPETA_EQUIPO = "illimani/equipo"

CARPETAS: dict[str, str] = {
    "destinos": CARPETA_DESTINOS,
    "proveedores": CARPETA_PROVEEDORES,
    "pasaportes": CARPETA_PASAPORTES,
    "carnets": CARPETA_CARNETS,
    "perfiles": CARPETA_PERFILES,
    "equipo": CARPETA_EQUIPO,
}

ETIQUETAS_CARPETA: dict[str, str] = {
    "destinos": "Láminas de destinos",
    "proveedores": "Fichas de proveedores",
    "pasaportes": "Pasaportes de viajeros",
    "carnets": "Carnets de identidad",
    "perfiles": "Retratos de viajeros",
    "equipo": "Retratos del equipo",
}

CARPETAS_CLIENTE: tuple[str, ...] = ("perfiles", "pasaportes", "carnets")

PREFIJOS_CLIENTE: tuple[str, ...] = tuple(
    CARPETAS[clave] for clave in CARPETAS_CLIENTE
)
