"""Comando `seed_data`: puebla datos iniciales realistas.

Fase 0: roles + usuarios de prueba (administrador y cliente).
Fase 3: destinos internacionales + proveedores de servicio.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalogo.models import Destino, Proveedor
from apps.usuarios.constants import (
    ROL_ADMINISTRADOR,
    ROL_CLIENTE,
    ROLES_INICIALES,
)
from apps.usuarios.models import Cliente, Rol, Usuario

DESTINOS_INICIALES = [
    {
        "nombre": "Machu Picchu",
        "pais": "Peru",
        "descripcion": "La ciudadela inca sobre las nubes. Un santuario de piedra entre picos andinos y niebla sagrada.",
        "latitud": -13.163141,
        "longitud": -72.544963,
        "etiquetas": ["inca", "patrimonio", "naturaleza", "arqueologia", "andino"],
    },
    {
        "nombre": "Salar de Uyuni",
        "pais": "Bolivia",
        "descripcion": "El espejo del cielo. La mayor extension de sal del mundo refleja el infinito bajo la luz del altiplano.",
        "latitud": -20.133333,
        "longitud": -67.483333,
        "etiquetas": ["naturaleza", "altiplano", "fotografia", "aventura"],
    },
    {
        "nombre": "Tiwanaku",
        "pais": "Bolivia",
        "descripcion": "Centro ceremonial precolombino a orillas del Titicaca. Puerta del Sol y monolitos milenarios.",
        "latitud": -16.554444,
        "longitud": -68.673333,
        "etiquetas": ["arqueologia", "precolombino", "altiplano", "patrimonio"],
    },
    {
        "nombre": "Costa Amalfitana",
        "pais": "Italia",
        "descripcion": "Acantilados, limoneros y pueblos de colores suspendidos sobre el Tirreno. Itinerario de autor entre Positano y Ravello.",
        "latitud": 40.634167,
        "longitud": 14.601389,
        "etiquetas": ["mediterraneo", "gastronomia", "naturaleza", "cultural"],
    },
    {
        "nombre": "Kioto y Takayama",
        "pais": "Japon",
        "descripcion": "Jardines de musgo, pabellones de te del siglo XVI y estancias en ryokans historicos bajo la mirada del Japon eterno.",
        "latitud": 35.011635,
        "longitud": 135.768036,
        "etiquetas": ["cultural", "historia", "gastronomia", "espiritual"],
    },
    {
        "nombre": "Atlas y Desierto del Sahara",
        "pais": "Marruecos",
        "descripcion": "Caravanas entre dunas de Erg Chebbi, kasbahs de adobe y la medina de Fes declarada Patrimonio de la Humanidad.",
        "latitud": 31.631794,
        "longitud": -7.992047,
        "etiquetas": ["desierto", "cultural", "aventura", "patrimonio"],
    },
    {
        "nombre": "Patagonia Austral",
        "pais": "Argentina",
        "descripcion": "Glaciares azules, cumbres de granito y el fin del mundo. Torres del Paine y el Perito Moreno como protagonistas.",
        "latitud": -51.629944,
        "longitud": -72.677589,
        "etiquetas": ["naturaleza", "aventura", "trekking", "glaciares"],
    },
    {
        "nombre": "Valle Sagrado de los Incas",
        "pais": "Peru",
        "descripcion": "El corazon del mundo inca: mercados de Pisac, la fortaleza de Ollantaytambo y textiles vivos de comunidades quechuas.",
        "latitud": -13.316667,
        "longitud": -72.083333,
        "etiquetas": ["inca", "cultural", "artesania", "andino"],
    },
]

PROVEEDORES_INICIALES = [
    {"nombre": "Andes Air Bolivia", "tipo": "aerolinea", "email": "operaciones@andesair.bo"},
    {"nombre": "LATAM Airlines", "tipo": "aerolinea", "email": "cargo@latam.com"},
    {"nombre": "Inkaterra Eco-Lodge", "tipo": "hotel", "email": "reservas@inkaterra.pe"},
    {"nombre": "Palacio del Inca Luxury Collection", "tipo": "hotel", "email": "concierge@palaciodel inca.pe"},
    {"nombre": "Transportes Altiplano S.R.L.", "tipo": "transporte", "email": "flota@altiplano.bo"},
    {"nombre": "Explora Expediciones", "tipo": "operador", "email": "guias@explora.bo"},
    {"nombre": "Condor Trek Peru", "tipo": "operador", "email": "info@condortrek.pe"},
]


class Command(BaseCommand):
    help = "Puebla la BD con datos iniciales: roles, usuarios, destinos y proveedores."

    @transaction.atomic
    def handle(self, *args, **options):
        self._seed_roles()
        self._seed_admin()
        self._seed_cliente()
        self._seed_destinos()
        self._seed_proveedores()
        self.stdout.write(self.style.SUCCESS("seed_data completado."))

    def _seed_roles(self):
        for rol_id, nombre in ROLES_INICIALES:
            Rol.objects.update_or_create(id=rol_id, defaults={"nombre": nombre})
        # Agente no esta en ROLES_INICIALES — asegurar que exista
        Rol.objects.get_or_create(id=2, defaults={"nombre": "agente"})
        self.stdout.write("  roles listos (administrador, agente, cliente)")

    def _seed_admin(self):
        email = "admin@illimanitravel.bo"
        usuario, creado = Usuario.objects.get_or_create(
            email=email,
            defaults={"rol_id": ROL_ADMINISTRADOR, "activo": True},
        )
        if creado:
            usuario.set_password("Admin12345")
            usuario.save(update_fields=["password"])
            self.stdout.write(f"  admin creado: {email} / Admin12345")
        else:
            self.stdout.write(f"  admin ya existia: {email}")

    def _seed_cliente(self):
        email = "cliente@illimanitravel.bo"
        usuario, creado = Usuario.objects.get_or_create(
            email=email,
            defaults={"rol_id": ROL_CLIENTE, "activo": True},
        )
        if creado:
            usuario.set_password("Cliente12345")
            usuario.save(update_fields=["password"])

        Cliente.objects.get_or_create(
            usuario=usuario,
            defaults={
                "nombres": "Ana",
                "apellidos": "Quispe Mamani",
                "documento_tipo": "CI",
                "documento_numero": "9876543",
                "pais_origen": "Bolivia",
            },
        )
        if creado:
            self.stdout.write(f"  cliente creado: {email} / Cliente12345")
        else:
            self.stdout.write(f"  cliente ya existia: {email}")

    def _seed_destinos(self):
        creados = 0
        for data in DESTINOS_INICIALES:
            _, nuevo = Destino.objects.get_or_create(
                nombre=data["nombre"],
                pais=data["pais"],
                defaults={k: v for k, v in data.items() if k not in ("nombre", "pais")},
            )
            if nuevo:
                creados += 1
        self.stdout.write(f"  destinos: {creados} nuevos, {len(DESTINOS_INICIALES) - creados} ya existian")

    def _seed_proveedores(self):
        creados = 0
        for data in PROVEEDORES_INICIALES:
            _, nuevo = Proveedor.objects.get_or_create(
                nombre=data["nombre"],
                defaults={k: v for k, v in data.items() if k != "nombre"},
            )
            if nuevo:
                creados += 1
        self.stdout.write(f"  proveedores: {creados} nuevos, {len(PROVEEDORES_INICIALES) - creados} ya existian")
