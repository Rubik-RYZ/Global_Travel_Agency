"""Comando `seed_data`: puebla datos iniciales realistas.

Fase 0: roles + usuarios de prueba (administrador y cliente).
Fase 3: destinos internacionales (con atributos comerciales e itinerario
día a día) + proveedores de servicio.

El comando es idempotente: usa `update_or_create`, de modo que volver a
ejecutarlo refresca la ficha comercial de cada destino sin duplicar filas.

Las láminas viven en `frontend/public/assets/` (viajan en el repositorio). Si
además existe `backend/apps/catalogo/media_catalogo.json` —generado con
`node scripts/subir-media-catalogo.mjs`— el seed usa esos enlaces del almacén
externo, de modo que quien clone el repositorio ve las imágenes sin
credenciales.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalogo.models import Destino, ItinerarioDia, Proveedor
from apps.usuarios.constants import (
    ROL_ADMINISTRADOR,
    ROL_CLIENTE,
    ROLES_INICIALES,
)
from apps.usuarios.models import Cliente, Rol, Usuario

RUTA_MEDIA_CATALOGO = (
    Path(__file__).resolve().parents[3] / "catalogo" / "media_catalogo.json"
)


def cargar_media_catalogo() -> dict[str, dict]:
    """Enlaces de las láminas ya subidas al almacén externo (Fase 3b).

    Devuelve un diccionario vacío si el archivo todavía no se ha generado, de
    forma que el seed use siempre las rutas locales de `frontend/public/assets/`.
    """
    try:
        with RUTA_MEDIA_CATALOGO.open(encoding="utf-8") as archivo:
            return json.load(archivo)
    except (OSError, ValueError):
        return {}


DESTINOS_INICIALES = [
    {
        "nombre": "Machu Picchu",
        "pais": "Peru",
        "pais_codigo": "PE",
        "region": "america_del_sur",
        "destacado": True,
        "resumen": "La ciudadela inca sobre las nubes, entre picos andinos y niebla sagrada.",
        "lema": "La ciudadela que despierta entre la niebla",
        "descripcion": (
            "La ciudadela inca sobre las nubes. Un santuario de piedra entre picos "
            "andinos y niebla sagrada, donde el descenso pausado por el valle del "
            "Urubamba se convierte en cuaderno botánico y memorial sensorial."
        ),
        "latitud": -13.163141,
        "longitud": -72.544963,
        "duracion_dias": 6,
        "duracion_noches": 5,
        "precio_desde": "1490.00",
        "moneda": "USD",
        "mejor_epoca": "Mayo a octubre (temporada seca y orquídeas)",
        "caracter": "arqueologico",
        "imagen_principal": "/assets/destino-2.jpg",
        "incluye": [
            "Traslados privados en Cusco y valle del Urubamba",
            "Boletos de ingreso a la ciudadela con guía historiador",
            "Casona colonial y eco-lodge en el valle",
        ],
        "no_incluye": ["Vuelos internacionales", "Propinas y gastos personales"],
        "etiquetas": ["inca", "patrimonio", "naturaleza", "arqueologia", "andino"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Llegada a Cusco y aclimatación", "ubicacion": "Cusco", "descripcion": "Recepción privada, mate de coca y tarde libre por el barrio de San Blas."},
            {"numero_dia": 2, "titulo": "Sacsayhuamán y Qorikancha", "ubicacion": "Cusco", "descripcion": "Recorrido por los templos incas y el convento colonial con historiador privado."},
            {"numero_dia": 3, "titulo": "Valle Sagrado: Pisac y Ollantaytambo", "ubicacion": "Valle Sagrado", "descripcion": "Mercado de Pisac y fortaleza de Ollantaytambo al atardecer."},
            {"numero_dia": 4, "titulo": "Descenso por el Urubamba", "ubicacion": "Aguas Calientes", "descripcion": "Tren Vistadome bordeando el cañón del Urubamba hasta Aguas Calientes."},
            {"numero_dia": 5, "titulo": "Amanecer en la Ciudadela", "ubicacion": "Machu Picchu", "descripcion": "Acceso privado al alba, Huayna Picchu y regreso a Cusco."},
            {"numero_dia": 6, "titulo": "Despedida y regreso", "ubicacion": "Cusco", "descripcion": "Mañana libre y traslado al aeropuerto de Velasco Astete."},
        ],
    },
    {
        "nombre": "Salar de Uyuni",
        "pais": "Bolivia",
        "pais_codigo": "BO",
        "region": "america_del_sur",
        "destacado": False,
        "resumen": "El espejo del cielo: la mayor extensión de sal del mundo.",
        "lema": "Donde el cielo se rinde a tus pies",
        "descripcion": (
            "El espejo del cielo. La mayor extensión de sal del mundo refleja el "
            "infinito bajo la luz del altiplano, entre islas de cactus y aguas termales."
        ),
        "latitud": -20.133333,
        "longitud": -67.483333,
        "duracion_dias": 4,
        "duracion_noches": 3,
        "precio_desde": "680.00",
        "moneda": "USD",
        "mejor_epoca": "Diciembre a abril (efecto espejo)",
        "caracter": "naturaleza",
        "imagen_principal": "/assets/destino-salar.jpg",
        "incluye": [
            "4x4 privado con chófer-guía del altiplano",
            "Pernocte en hotel de sal",
            "Pensión completa durante el recorrido",
        ],
        "no_incluye": ["Vuelo La Paz–Uyuni", "Entradas a reservas"],
        "etiquetas": ["naturaleza", "altiplano", "fotografia", "aventura"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Cementerio de trenes y Colchani", "ubicacion": "Uyuni", "descripcion": "Arranque en el cementerio de trenes y los montículos de sal de Colchani."},
            {"numero_dia": 2, "titulo": "Borde del salar y Isla Incahuasi", "ubicacion": "Salar de Uyuni", "descripcion": "Atardecer sobre la costra blanca y cactus milenarios en la isla."},
            {"numero_dia": 3, "titulo": "Lagunas de colores y aguas termales", "ubicacion": "Reserva Eduardo Avaroa", "descripcion": "Laguna Colorada, géiseres y baño termal al anochecer."},
            {"numero_dia": 4, "titulo": "Regreso a Uyuni", "ubicacion": "Uyuni", "descripcion": "Últimas tomas del efecto espejo y retorno a la ciudad."},
        ],
    },
    {
        "nombre": "Tiwanaku",
        "pais": "Bolivia",
        "pais_codigo": "BO",
        "region": "america_del_sur",
        "destacado": False,
        "resumen": "Centro ceremonial precolombino a orillas del Titicaca.",
        "lema": "La piedra que guarda el origen del altiplano",
        "descripcion": (
            "Centro ceremonial precolombino a orillas del Titicaca. Puerta del Sol, "
            "monolitos milenarios y la sabiduría astronómica de una civilización andina."
        ),
        "latitud": -16.554444,
        "longitud": -68.673333,
        "duracion_dias": 3,
        "duracion_noches": 2,
        "precio_desde": "420.00",
        "moneda": "USD",
        "mejor_epoca": "Abril a octubre (cielo despejado del altiplano)",
        "caracter": "arqueologico",
        "imagen_principal": "/assets/destino-tiwanaku.jpg",
        "incluye": [
            "Guía arqueólogo especializado en Tiwanaku",
            "Transporte privado La Paz–Tiwanaku",
            "Visita al museo lítico",
        ],
        "no_incluye": ["Almuerzos", "Extras personales"],
        "etiquetas": ["arqueologia", "precolombino", "altiplano", "patrimonio"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "La Paz y el mirador del altiplano", "ubicacion": "La Paz", "descripcion": "Recorrido por el centro histórico y preparación de la ruta andina."},
            {"numero_dia": 2, "titulo": "Complejo arqueológico de Tiwanaku", "ubicacion": "Tiwanaku", "descripcion": "Templo de Kalasasaya, Puerta del Sol y monolitos con arqueólogo."},
            {"numero_dia": 3, "titulo": "Orillas del Titicaca", "ubicacion": "Lago Titicaca", "descripcion": "Puerto de Guaqui y comunidades aymaras del lago sagrado."},
        ],
    },
    {
        "nombre": "Costa Amalfitana",
        "pais": "Italia",
        "pais_codigo": "IT",
        "region": "europa",
        "destacado": True,
        "resumen": "Acantilados, limoneros y pueblos suspendidos sobre el Tirreno.",
        "lema": "Acantilados donde el limón perfuma el mar",
        "descripcion": (
            "Acantilados, limoneros y pueblos de colores suspendidos sobre el Tirreno. "
            "Itinerario de autor entre Positano y Ravello, entre viñedos y navegación privada."
        ),
        "latitud": 40.634167,
        "longitud": 14.601389,
        "duracion_dias": 6,
        "duracion_noches": 5,
        "precio_desde": "2150.00",
        "moneda": "EUR",
        "mejor_epoca": "Mayo a junio y septiembre a octubre",
        "caracter": "gastronomico",
        "imagen_principal": "/assets/landing-ambiente.jpg",
        "incluye": [
            "Villa histórica con vistas al mar",
            "Navegación privada en gozzo por los Faraglioni",
            "Cata de limoncello y aceite en bodega familiar",
        ],
        "no_incluye": ["Vuelos", "Traslados aeropuerto"],
        "etiquetas": ["mediterraneo", "gastronomia", "naturaleza", "cultural"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Nápoles y llegada a Positano", "ubicacion": "Positano", "descripcion": "Traslado por la costa y primer paseo por sus callejones."},
            {"numero_dia": 2, "titulo": "Sendero de los Dioses", "ubicacion": "Agerola", "descripcion": "Caminata entre limoneros silvestres sobre el Tirreno."},
            {"numero_dia": 3, "titulo": "Ravello y sus villas", "ubicacion": "Ravello", "descripcion": "Villa Cimbrone, Villa Rufolo y concierto de cámara al atardecer."},
            {"numero_dia": 4, "titulo": "Capri y los Faraglioni", "ubicacion": "Capri", "descripcion": "Navegación privada en gozzo y Gruta Azul."},
            {"numero_dia": 5, "titulo": "Amalfi y bodegas del Vesubio", "ubicacion": "Amalfi", "descripcion": "Duomo, cartuja de papel y cata de vinos volcánicos."},
            {"numero_dia": 6, "titulo": "Regreso", "ubicacion": "Nápoles", "descripcion": "Mañana libre en Positano y traslado al aeropuerto."},
        ],
    },
    {
        "nombre": "Kioto y Takayama",
        "pais": "Japon",
        "pais_codigo": "JP",
        "region": "asia",
        "destacado": True,
        "resumen": "Jardines de musgo, pabellones de té y ryokans históricos.",
        "lema": "La senda del silencio: templos, niebla y tatamis",
        "descripcion": (
            "Jardines de musgo, pabellones de té del siglo XVI y estancias en ryokans "
            "históricos bajo la mirada pausada del Japón eterno. Una pieza musical en tres actos."
        ),
        "latitud": 35.011635,
        "longitud": 135.768036,
        "duracion_dias": 12,
        "duracion_noches": 11,
        "precio_desde": "6200.00",
        "moneda": "EUR",
        "mejor_epoca": "Marzo a mayo (Sakura) y noviembre (Momiji)",
        "caracter": "cultural",
        "imagen_principal": "/assets/destino-1.jpg",
        "incluye": [
            "Tren bala Gran Class Tokio–Kioto",
            "Ryokan tradicional con onsen privado",
            "Ceremonia del té con maestro venerable",
            "Curador residente en Kioto durante toda la ruta",
        ],
        "no_incluye": ["Vuelos intercontinentales", "Seguro de viaje"],
        "etiquetas": ["cultural", "historia", "gastronomia", "espiritual"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Llegada a Tokio", "ubicacion": "Tokio", "descripcion": "Recepción privada en Narita y traslado al hotel en Ginza."},
            {"numero_dia": 2, "titulo": "Tokio moderno y Asakusa", "ubicacion": "Tokio", "descripcion": "Templo Senso-ji al alba y barrios de artesanos."},
            {"numero_dia": 3, "titulo": "Shinkansen hacia Kioto", "ubicacion": "Kioto", "descripcion": "Tren bala Gran Class bordeando la ladera sur del Monte Fuji."},
            {"numero_dia": 4, "titulo": "Ryoan-ji al amanecer", "ubicacion": "Kioto", "descripcion": "Acceso privado al jardín seco junto al abad de la congregación zen."},
            {"numero_dia": 5, "titulo": "Kinkaku-ji y Gion", "ubicacion": "Kioto", "descripcion": "Pabellón Dorado y callejones de machiyas al anochecer."},
            {"numero_dia": 6, "titulo": "Ceremonia del té en Uji", "ubicacion": "Uji", "descripcion": "Plantaciones de matcha con una familia de cultivadores."},
            {"numero_dia": 7, "titulo": "Arashiyama en barca", "ubicacion": "Arashiyama", "descripcion": "Paseo fluvial privado por los desfiladeros de bambú."},
            {"numero_dia": 8, "titulo": "Camino a Takayama", "ubicacion": "Takayama", "descripcion": "Tren alpino hacia las montañas de Hida."},
            {"numero_dia": 9, "titulo": "Shirakawa-go y onsen", "ubicacion": "Shirakawa", "descripcion": "Aldea gassho-zukuri UNESCO y baños termales al aire libre."},
            {"numero_dia": 10, "titulo": "Maestro forjador de katanas", "ubicacion": "Seki", "descripcion": "Audiencia privada en un taller histórico de acero tamahagane."},
            {"numero_dia": 11, "titulo": "Banquete kaiseki en Gion", "ubicacion": "Kioto", "descripcion": "Cena a puerta cerrada con geiko y maiko veteranas."},
            {"numero_dia": 12, "titulo": "Despedida", "ubicacion": "Kioto", "descripcion": "Última visita al jardín y traslado al aeropuerto de Kansai."},
        ],
    },
    {
        "nombre": "Atlas y Desierto del Sahara",
        "pais": "Marruecos",
        "pais_codigo": "MA",
        "region": "africa",
        "destacado": False,
        "resumen": "Caravanas entre dunas de Erg Chebbi y la medina de Fes.",
        "lema": "Dunas, kasbahs y noches sin horizonte",
        "descripcion": (
            "Caravanas entre dunas de Erg Chebbi, kasbahs de adobe y la medina de Fes, "
            "Patrimonio de la Humanidad. Noches bajo las estrellas en campamento de lujo."
        ),
        "latitud": 31.631794,
        "longitud": -7.992047,
        "duracion_dias": 7,
        "duracion_noches": 6,
        "precio_desde": "1180.00",
        "moneda": "USD",
        "mejor_epoca": "Octubre a abril (noches frescas del desierto)",
        "caracter": "aventura",
        "imagen_principal": "/assets/destino-sahara.jpg",
        "incluye": [
            "Campamento de lujo en las dunas de Erg Chebbi",
            "4x4 privado con chófer bereber",
            "Guía en la medina de Fes",
        ],
        "no_incluye": ["Vuelos", "Cenas fuera del campamento"],
        "etiquetas": ["desierto", "cultural", "aventura", "patrimonio"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Marrakech y la plaza Jemaa el-Fna", "ubicacion": "Marrakech", "descripcion": "Zocos, palacios y narradores al anochecer."},
            {"numero_dia": 2, "titulo": "Alto Atlas y Ait Ben Haddou", "ubicacion": "Ait Ben Haddou", "descripcion": "Puerto de Tizi n'Tichka y ksar fortificado."},
            {"numero_dia": 3, "titulo": "Gargantas del Todra", "ubicacion": "Todra", "descripcion": "Cañón de paredes verticales y oasis de palmeras."},
            {"numero_dia": 4, "titulo": "Dunas de Erg Chebbi", "ubicacion": "Merzouga", "descripcion": "Paseo en dromedario y cena bereber bajo las estrellas."},
            {"numero_dia": 5, "titulo": "Ruta de las kasbahs", "ubicacion": "Skoura", "descripcion": "Palmerales y kasbahs de adobe camino al norte."},
            {"numero_dia": 6, "titulo": "Medina de Fes", "ubicacion": "Fes", "descripcion": "Tenerías, madrazas y gremios artesanos con guía local."},
            {"numero_dia": 7, "titulo": "Regreso desde Fes", "ubicacion": "Fes", "descripcion": "Mañana libre y traslado al aeropuerto."},
        ],
    },
    {
        "nombre": "Patagonia Austral",
        "pais": "Argentina",
        "pais_codigo": "AR",
        "region": "america_del_sur",
        "destacado": False,
        "resumen": "Glaciares azules, cumbres de granito y el fin del mundo.",
        "lema": "El fin del mundo, en silencio de hielo",
        "descripcion": (
            "Glaciares azules, cumbres de granito y el fin del mundo. Torres del Paine y "
            "el glaciar Perito Moreno como protagonistas de una travesía de viento y hielo."
        ),
        "latitud": -51.629944,
        "longitud": -72.677589,
        "duracion_dias": 6,
        "duracion_noches": 5,
        "precio_desde": "1980.00",
        "moneda": "USD",
        "mejor_epoca": "Noviembre a marzo (verano austral)",
        "caracter": "aventura",
        "imagen_principal": "/assets/destino-patagonia.jpg",
        "incluye": [
            "Lodge de montaña con vista al macizo",
            "Navegación al glaciar Perito Moreno",
            "Guía de trekking certificado",
        ],
        "no_incluye": ["Vuelos a El Calafate", "Equipo técnico de montaña"],
        "etiquetas": ["naturaleza", "aventura", "trekking", "glaciares"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Llegada a El Calafate", "ubicacion": "El Calafate", "descripcion": "Traslado al lodge y charla de preparación del trekking."},
            {"numero_dia": 2, "titulo": "Glaciar Perito Moreno", "ubicacion": "Los Glaciares", "descripcion": "Pasarelas y navegación al frente de hielo."},
            {"numero_dia": 3, "titulo": "Cruce a Torres del Paine", "ubicacion": "Puerto Natales", "descripcion": "Estepa patagónica y primer avistamiento del macizo."},
            {"numero_dia": 4, "titulo": "Base Torres", "ubicacion": "Torres del Paine", "descripcion": "Trekking al mirador de las tres torres de granito."},
            {"numero_dia": 5, "titulo": "Grey y glaciares colgantes", "ubicacion": "Lago Grey", "descripcion": "Navegación entre témpanos y bosque nativo."},
            {"numero_dia": 6, "titulo": "Regreso", "ubicacion": "Punta Arenas", "descripcion": "Mirador del viento y traslado al aeropuerto."},
        ],
    },
    {
        "nombre": "Valle Sagrado de los Incas",
        "pais": "Peru",
        "pais_codigo": "PE",
        "region": "america_del_sur",
        "destacado": False,
        "resumen": "El corazón del mundo inca: Pisac, Ollantaytambo y textiles vivos.",
        "lema": "Terrazas, telares y el río que habla quechua",
        "descripcion": (
            "El corazón del mundo inca: mercados de Pisac, la fortaleza de Ollantaytambo "
            "y textiles vivos de las comunidades quechuas del valle del Urubamba."
        ),
        "latitud": -13.316667,
        "longitud": -72.083333,
        "duracion_dias": 5,
        "duracion_noches": 4,
        "precio_desde": "990.00",
        "moneda": "USD",
        "mejor_epoca": "Abril a octubre (cielo limpio y cosecha)",
        "caracter": "cultural",
        "imagen_principal": "/assets/destino-15.jpg",
        "incluye": [
            "Talleres de textilería con comunidades quechuas",
            "Hacienda colonial con pensión completa",
            "Guía cultural privado",
        ],
        "no_incluye": ["Vuelos", "Entradas a Machu Picchu"],
        "etiquetas": ["inca", "cultural", "artesania", "andino"],
        "itinerario": [
            {"numero_dia": 1, "titulo": "Cusco, capital del Tahuantinsuyo", "ubicacion": "Cusco", "descripcion": "Plaza de Armas, Qorikancha y barrio de San Blas."},
            {"numero_dia": 2, "titulo": "Mercado de Pisac", "ubicacion": "Pisac", "descripcion": "Feria artesana y andenes incas sobre el valle."},
            {"numero_dia": 3, "titulo": "Ollantaytambo", "ubicacion": "Ollantaytambo", "descripcion": "Fortaleza viva y callejones de piedra con agua corriente."},
            {"numero_dia": 4, "titulo": "Maras y Moray", "ubicacion": "Maras", "descripcion": "Salineras de sal rosada y laboratorio agrícola inca."},
            {"numero_dia": 5, "titulo": "Despedida en el valle", "ubicacion": "Urubamba", "descripcion": "Taller textil con una comunidad quechua y regreso a Cusco."},
        ],
    },
]

PROVEEDORES_INICIALES = [
    {
        "nombre": "Andes Air Bolivia", "tipo": "aerolinea",
        "pais": "Bolivia", "ciudad": "La Paz", "contacto": "Operaciones",
        "email": "operaciones@andesair.bo",
        "notas": "Conexiones nacionales desde el aeropuerto de El Alto (LPB).",
    },
    {
        "nombre": "LATAM Airlines", "tipo": "aerolinea",
        "pais": "Chile", "ciudad": "Santiago", "contacto": "Carga internacional",
        "email": "cargo@latam.com",
        "notas": "Rutas internacionales hacia Sudamérica y conexión con Europa.",
    },
    {
        "nombre": "Inkaterra Eco-Lodge", "tipo": "hotel",
        "pais": "Perú", "ciudad": "Machu Picchu", "contacto": "Reservas",
        "email": "reservas@inkaterra.pe",
        "notas": "Hospedaje dentro del Santuario Histórico de Machu Picchu.",
    },
    {
        "nombre": "Palacio del Inca Luxury Collection", "tipo": "hotel",
        "pais": "Perú", "ciudad": "Cusco", "contacto": "Concierge",
        "email": "concierge@palaciodelinca.pe",
        "notas": "Casona patrimonial frente a la Plaza de Armas del Cusco.",
        "logo": "/assets/proveedor-1.jpg",
    },
    {
        "nombre": "Transportes Altiplano S.R.L.", "tipo": "transporte",
        "pais": "Bolivia", "ciudad": "El Alto", "contacto": "Flota",
        "email": "flota@altiplano.bo",
        "notas": "Traslados terrestres privados en el altiplano boliviano.",
    },
    {
        "nombre": "Explora Expediciones", "tipo": "operador",
        "pais": "Bolivia", "ciudad": "La Paz", "contacto": "Guías",
        "email": "guias@explora.bo",
        "notas": "Operador de trekking y expediciones de altura.",
    },
    {
        "nombre": "Condor Trek Peru", "tipo": "operador",
        "pais": "Perú", "ciudad": "Cusco", "contacto": "Informes",
        "email": "info@condortrek.pe",
        "notas": "Operador de rutas de trekking en los Andes peruanos.",
    },
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
        creados = actualizados = dias = 0
        media = cargar_media_catalogo()
        for data in DESTINOS_INICIALES:
            payload = {k: v for k, v in data.items()
                       if k not in ("nombre", "pais", "itinerario")}
            # Si las láminas ya se subieron al almacén, el seed guarda el enlace
            # público (y su id) en lugar de la ruta local.
            enlace = media.get(data.get("imagen_principal") or "")
            if enlace:
                payload["imagen_principal"] = enlace["url"]
                payload["imagen_public_id"] = enlace.get("public_id")
            destino, nuevo = Destino.objects.update_or_create(
                nombre=data["nombre"],
                pais=data["pais"],
                defaults=payload,
            )
            dias += self._seed_itinerario(destino, data.get("itinerario", []))
            if nuevo:
                creados += 1
            else:
                actualizados += 1
        self.stdout.write(
            f"  destinos: {creados} nuevos, {actualizados} actualizados, "
            f"{dias} días de itinerario"
        )

    def _seed_itinerario(self, destino, dias: list[dict]) -> int:
        if not dias:
            return 0
        destino.itinerario.all().delete()
        ItinerarioDia.objects.bulk_create([
            ItinerarioDia(
                destino=destino,
                numero_dia=d["numero_dia"],
                titulo=d["titulo"],
                descripcion=d.get("descripcion"),
                ubicacion=d.get("ubicacion"),
            )
            for d in dias
        ])
        return len(dias)

    def _seed_proveedores(self):
        creados = 0
        media = cargar_media_catalogo()
        for data in PROVEEDORES_INICIALES:
            payload = {k: v for k, v in data.items() if k != "nombre"}
            # La lámina del prestador también puede vivir en el almacén externo.
            logo = payload.pop("logo", None)
            if logo:
                enlace = media.get(logo)
                if enlace:
                    payload["logo_url"] = enlace["url"]
                    payload["logo_public_id"] = enlace.get("public_id")
                else:
                    payload["logo_url"] = logo
            _, nuevo = Proveedor.objects.update_or_create(
                nombre=data["nombre"],
                defaults=payload,
            )
            if nuevo:
                creados += 1
        self.stdout.write(f"  proveedores: {creados} nuevos, {len(PROVEEDORES_INICIALES) - creados} ya existian")
