ROL_ADMINISTRADOR = 1
ROL_AGENTE = 2
ROL_CLIENTE = 3

NOMBRE_ADMINISTRADOR = "administrador"
NOMBRE_AGENTE = "agente"
NOMBRE_CLIENTE = "cliente"

ROLES_INICIALES = [
    (ROL_ADMINISTRADOR, NOMBRE_ADMINISTRADOR),
    (ROL_AGENTE, NOMBRE_AGENTE),
    (ROL_CLIENTE, NOMBRE_CLIENTE),
]

ROLES_EQUIPO = (ROL_ADMINISTRADOR, ROL_AGENTE)

DOCUMENTO_CI = "CI"
DOCUMENTO_PASAPORTE = "PASAPORTE"
DOCUMENTO_OTRO = "OTRO"
DOCUMENTO_TIPOS = [
    (DOCUMENTO_CI, "Cédula de identidad"),
    (DOCUMENTO_PASAPORTE, "Pasaporte"),
    (DOCUMENTO_OTRO, "Otro"),
]

MONEDAS = [
    ("BOB", "Boliviano"),
    ("USD", "Dólar estadounidense"),
    ("EUR", "Euro"),
]

INTERESES_SUGERIDOS = [
    "playa",
    "cultural",
    "aventura",
    "gastronomia",
    "naturaleza",
    "compras",
    "romantico",
    "familiar",
    "historico",
    "nocturno",
]
