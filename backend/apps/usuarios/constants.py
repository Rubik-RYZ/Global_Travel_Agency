"""Constantes de dominio del módulo de usuarios y clientes."""

# --- IDs de rol (coinciden con el catálogo sembrado en la BD) ---
ROL_ADMINISTRADOR = 1
ROL_AGENTE = 2
ROL_CLIENTE = 3

ROLES_INICIALES = [
    (ROL_ADMINISTRADOR, "administrador"),
    (ROL_AGENTE, "agente"),
    (ROL_CLIENTE, "cliente"),
]

# --- Tipos de documento de identidad ---
DOCUMENTO_CI = "CI"
DOCUMENTO_PASAPORTE = "PASAPORTE"
DOCUMENTO_OTRO = "OTRO"
DOCUMENTO_TIPOS = [
    (DOCUMENTO_CI, "Cédula de identidad"),
    (DOCUMENTO_PASAPORTE, "Pasaporte"),
    (DOCUMENTO_OTRO, "Otro"),
]

# --- Monedas soportadas ---
MONEDAS = [
    ("BOB", "Boliviano"),
    ("USD", "Dólar estadounidense"),
    ("EUR", "Euro"),
]

# --- Intereses / etiquetas de preferencia y destino ---
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
