"""Constantes de dominio del catálogo turístico."""

TIPOS_PROVEEDOR = [
    ("aerolinea", "Aerolínea"),
    ("hotel", "Hotel"),
    ("transporte", "Transporte"),
    ("operador", "Operador"),
    ("otro", "Otro"),
]

# Regiones/continentes que usa la operación para agrupar el catálogo
# (barra de "Región cartográfica" del explorador de destinos).
REGIONES = [
    ("america_del_sur", "América del Sur"),
    ("america_del_norte", "América del Norte"),
    ("europa", "Europa"),
    ("asia", "Asia"),
    ("africa", "África"),
    ("oceania", "Oceanía"),
]

# Carácter del viaje: cómo se vende la experiencia (filtro "Carácter de viaje").
CARACTERES_VIAJE = [
    ("arqueologico", "Arqueología y templos"),
    ("cultural", "Cultural y patrimonial"),
    ("naturaleza", "Naturaleza y paisaje"),
    ("aventura", "Aventura y trekking"),
    ("gastronomico", "Gastronomía y enoturismo"),
    ("descanso", "Villas y retiros"),
]

# Monedas ISO 4217 con las que la agencia cotiza sus paquetes.
MONEDAS = ["USD", "BOB", "EUR"]
