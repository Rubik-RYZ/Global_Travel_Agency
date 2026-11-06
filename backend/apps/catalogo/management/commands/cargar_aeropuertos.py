"""Comando para poblar aeropuertos clave vinculados a destinos (CU3 / CU4)."""
from django.core.management.base import BaseCommand
from apps.catalogo.models import Aeropuerto, Destino


AEROPUERTOS_SEED = [
    {"codigo_iata": "LPB", "nombre": "Aeropuerto Internacional El Alto", "destino_nombre": "Tiwanaku"},
    {"codigo_iata": "VVI", "nombre": "Aeropuerto Internacional Viru Viru", "destino_nombre": "Tiwanaku"},
    {"codigo_iata": "UYU", "nombre": "Aeropuerto Joya Andina", "destino_nombre": "Salar de Uyuni"},
    {"codigo_iata": "CUZ", "nombre": "Aeropuerto Internacional Alejandro Velasco Astete", "destino_nombre": "Machu Picchu"},
    {"codigo_iata": "LIM", "nombre": "Aeropuerto Internacional Jorge Chávez", "destino_nombre": "Valle Sagrado de los Incas"},
    {"codigo_iata": "NAP", "nombre": "Aeropuerto Internacional de Nápoles-Capodichino", "destino_nombre": "Costa Amalfitana"},
    {"codigo_iata": "FCO", "nombre": "Aeropuerto de Roma-Fiumicino Leonardo da Vinci", "destino_nombre": "Costa Amalfitana"},
    {"codigo_iata": "KIX", "nombre": "Aeropuerto Internacional de Kansai", "destino_nombre": "Kioto y Takayama"},
    {"codigo_iata": "NRT", "nombre": "Aeropuerto Internacional de Narita", "destino_nombre": "Kioto y Takayama"},
    {"codigo_iata": "RAK", "nombre": "Aeropuerto de Marrakech-Menara", "destino_nombre": "Atlas y Desierto del Sahara"},
    {"codigo_iata": "FTE", "nombre": "Aeropuerto Internacional Comandante Armando Tola (El Calafate)", "destino_nombre": "Patagonia Austral"},
    {"codigo_iata": "EZE", "nombre": "Aeropuerto Internacional Ministro Pistarini (Ezeiza)", "destino_nombre": "Patagonia Austral"},
]


class Command(BaseCommand):
    help = "Carga aeropuertos iniciales vinculados a destinos"

    def handle(self, *args, **options):
        creados = 0
        actualizados = 0
        for datos in AEROPUERTOS_SEED:
            destino = Destino.objects.filter(nombre__icontains=datos["destino_nombre"]).first()
            if not destino:
                destino = Destino.objects.first()
            if not destino:
                self.stderr.write("No hay destinos cargados aún.")
                return

            obj, created = Aeropuerto.objects.update_or_create(
                codigo_iata=datos["codigo_iata"],
                defaults={
                    "nombre": datos["nombre"],
                    "destino": destino,
                },
            )
            if created:
                creados += 1
            else:
                actualizados += 1

        self.stdout.write(self.style.SUCCESS(f"Aeropuertos cargados: {creados} creados, {actualizados} actualizados."))

