"""Datos de demostración para los reportes gerenciales (CU12).

Crea cinco clientes con cuenta, cinco vuelos internacionales, dos paquetes
a otros países, salidas en fin de semana y reservas/pagos repartidos en
distintos fines de semana para que las gráficas tengan datos variados.

Uso:
    python manage.py cargar_datos_reporte

Requiere haber ejecutado antes ``python manage.py seed_data``.
"""
from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.catalogo.models import (
    Aeropuerto,
    Destino,
    Paquete,
    PaqueteSalida,
    Proveedor,
    Vuelo,
)
from apps.pagos.models import Pago
from apps.reservas.models.reserva import Reserva
from apps.reservas.models.reserva_pasajero import ReservaPasajero
from apps.usuarios.models import Cliente, Rol, Usuario

PASSWORD = "Viajero12345"

CLIENTES = [
    {
        "clave": "lucia",
        "email": "lucia.quispe@viajero.test",
        "nombres": "Lucía",
        "apellidos": "Quispe",
        "documento": "8123456",
        "telefono": "+591 71234567",
        "fecha_nacimiento": date(1994, 3, 12),
    },
    {
        "clave": "mateo",
        "email": "mateo.fernandez@viajero.test",
        "nombres": "Mateo",
        "apellidos": "Fernández",
        "documento": "7456123",
        "telefono": "+591 72345678",
        "fecha_nacimiento": date(1989, 7, 25),
    },
    {
        "clave": "valentina",
        "email": "valentina.rojas@viajero.test",
        "nombres": "Valentina",
        "apellidos": "Rojas",
        "documento": "9234567",
        "telefono": "+591 73456789",
        "fecha_nacimiento": date(1998, 11, 3),
    },
    {
        "clave": "diego",
        "email": "diego.mamani@viajero.test",
        "nombres": "Diego",
        "apellidos": "Mamani",
        "documento": "6543210",
        "telefono": "+591 74567890",
        "fecha_nacimiento": date(1992, 1, 18),
    },
    {
        "clave": "camila",
        "email": "camila.torrez@viajero.test",
        "nombres": "Camila",
        "apellidos": "Torrez",
        "documento": "5678901",
        "telefono": "+591 75678901",
        "fecha_nacimiento": date(1996, 5, 30),
    },
]

# Salidas: (paquete, clave, fecha, vuelo_ida, vuelo_vuelta)
SALIDAS = [
    ("machu", "machu_2026_06_06", date(2026, 6, 6), "ob771", "la2401"),
    ("machu", "machu_2026_08_08", date(2026, 8, 8), None, None),
    ("machu", "machu_2026_12_12", date(2026, 12, 12), None, None),
    ("machu", "machu_2026_12_19", date(2026, 12, 19), None, None),
    ("machu", "machu_2027_01_09", date(2027, 1, 9), None, None),
    ("amalfi", "amalfi_2026_07_18", date(2026, 7, 18), None, None),
    ("amalfi", "amalfi_2026_09_05", date(2026, 9, 5), "ob772", "la2402"),
    ("amalfi", "amalfi_2026_11_28", date(2026, 11, 28), None, None),
    ("amalfi", "amalfi_2027_01_23", date(2027, 1, 23), None, None),
    ("amalfi", "amalfi_2027_01_30", date(2027, 1, 30), None, None),
    ("uyuni", "uyuni_2026_11_14", date(2026, 11, 14), None, None),
]

RESERVAS = [
    {
        "codigo": "RES-DEMO-101",
        "cliente": "lucia",
        "salida": "machu_2026_06_06",
        "pax": 2,
        "canal": Reserva.CANAL_WEB,
        "empleado": None,
        "metodo": "tarjeta",
        "creada": (date(2026, 5, 9), 10, 15),
        "pagada": (date(2026, 5, 10), 18, 30),
        "pasajeros": [("Lucía", "Quispe", "8123456"), ("Jorge", "Quispe", "8123457")],
    },
    {
        "codigo": "RES-DEMO-102",
        "cliente": "lucia",
        "salida": "amalfi_2026_09_05",
        "pax": 2,
        "canal": Reserva.CANAL_PERSONAL,
        "empleado": "ventanilla1",
        "metodo": "efectivo",
        "creada": (date(2026, 7, 18), 11, 0),
        "pagada": (date(2026, 7, 19), 19, 0),
        "pasajeros": [("Lucía", "Quispe", "8123456"), ("Jorge", "Quispe", "8123457")],
    },
    {
        "codigo": "RES-DEMO-103",
        "cliente": "lucia",
        "salida": "machu_2026_12_12",
        "pax": 2,
        "canal": Reserva.CANAL_WEB,
        "empleado": None,
        "metodo": "tarjeta",
        "creada": (date(2026, 10, 10), 12, 30),
        "pagada": (date(2026, 10, 11), 20, 15),
        "pasajeros": [("Lucía", "Quispe", "8123456"), ("Jorge", "Quispe", "8123457")],
    },
    {
        "codigo": "RES-DEMO-104",
        "cliente": "mateo",
        "salida": "amalfi_2026_07_18",
        "pax": 2,
        "canal": Reserva.CANAL_WEB,
        "empleado": None,
        "metodo": "transferencia",
        "creada": (date(2026, 6, 6), 9, 45),
        "pagada": (date(2026, 6, 7), 17, 0),
        "pasajeros": [
            ("Mateo", "Fernández", "7456123"),
            ("Sofía", "Fernández", "7456124"),
        ],
    },
    {
        "codigo": "RES-DEMO-105",
        "cliente": "mateo",
        "salida": "uyuni_2026_11_14",
        "pax": 2,
        "canal": Reserva.CANAL_AGENTE,
        "empleado": "ventanilla2",
        "metodo": "efectivo",
        "creada": (date(2026, 9, 5), 14, 20),
        "pagada": (date(2026, 9, 6), 18, 45),
        "pasajeros": [
            ("Mateo", "Fernández", "7456123"),
            ("Sofía", "Fernández", "7456124"),
        ],
    },
    {
        "codigo": "RES-DEMO-106",
        "cliente": "mateo",
        "salida": "machu_2027_01_09",
        "pax": 2,
        "canal": Reserva.CANAL_PERSONAL,
        "empleado": "ventanilla1",
        "metodo": "tarjeta",
        "creada": (date(2026, 10, 17), 10, 5),
        "pagada": (date(2026, 10, 18), 16, 30),
        "pasajeros": [
            ("Mateo", "Fernández", "7456123"),
            ("Sofía", "Fernández", "7456124"),
        ],
    },
    {
        "codigo": "RES-DEMO-107",
        "cliente": "valentina",
        "salida": "amalfi_2026_11_28",
        "pax": 1,
        "canal": Reserva.CANAL_WEB,
        "empleado": None,
        "metodo": "transferencia",
        "creada": (date(2026, 8, 8), 15, 40),
        "pagada": (date(2026, 8, 9), 19, 30),
        "pasajeros": [("Valentina", "Rojas", "9234567")],
    },
    {
        "codigo": "RES-DEMO-108",
        "cliente": "valentina",
        "salida": "amalfi_2027_01_23",
        "pax": 1,
        "canal": Reserva.CANAL_WEB,
        "empleado": None,
        "metodo": "tarjeta",
        "creada": (date(2026, 10, 24), 11, 25),
        "pagada": (date(2026, 10, 25), 20, 0),
        "pasajeros": [("Valentina", "Rojas", "9234567")],
    },
    {
        "codigo": "RES-DEMO-109",
        "cliente": "valentina",
        "salida": "amalfi_2027_01_30",
        "pax": 1,
        "canal": Reserva.CANAL_PERSONAL,
        "empleado": "ventanilla2",
        "metodo": "efectivo",
        "creada": (date(2026, 10, 31), 18, 0),
        "pagada": (date(2026, 11, 1), 12, 0),
        "pasajeros": [("Valentina", "Rojas", "9234567")],
    },
]


def _aware(fecha: date, hora: int, minuto: int = 0) -> datetime:
    return timezone.make_aware(
        datetime.combine(fecha, time(hora, minuto)),
        timezone.get_current_timezone(),
    )


class Command(BaseCommand):
    help = (
        "Carga 5 clientes con cuenta, 5 vuelos, 2 paquetes internacionales y "
        "reservas/pagos de fin de semana para los reportes."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        if not Destino.objects.exists():
            self.stderr.write(
                self.style.ERROR(
                    "No hay destinos cargados. Ejecute primero: "
                    "python manage.py seed_data"
                )
            )
            return

        call_command("cargar_aeropuertos", verbosity=0)

        rol_cliente = Rol.objects.get(nombre="cliente")
        clientes = self._crear_clientes(rol_cliente)
        paquetes = self._crear_paquetes()
        vuelos = self._crear_vuelos()
        salidas = self._crear_salidas(paquetes, vuelos)
        empleados = self._empleados()
        self._crear_reservas(clientes, salidas, empleados)
        self._recalcular_cupos(salidas)
        self._resumen(clientes)

    def _crear_clientes(self, rol_cliente: Rol) -> dict[str, Cliente]:
        clientes: dict[str, Cliente] = {}
        for datos in CLIENTES:
            usuario = Usuario.objects.filter(email__iexact=datos["email"]).first()
            if usuario is None:
                usuario = Usuario.objects.create_user(
                    email=datos["email"],
                    password=PASSWORD,
                    rol=rol_cliente,
                )
            else:
                usuario.rol = rol_cliente
                usuario.activo = True
                if not usuario.check_password(PASSWORD):
                    usuario.set_password(PASSWORD)
                usuario.save()

            cliente, _ = Cliente.objects.update_or_create(
                usuario=usuario,
                defaults={
                    "nombres": datos["nombres"],
                    "apellidos": datos["apellidos"],
                    "documento_tipo": "CI",
                    "documento_numero": datos["documento"],
                    "telefono": datos["telefono"],
                    "fecha_nacimiento": datos["fecha_nacimiento"],
                    "pais_origen": "Bolivia",
                },
            )
            clientes[datos["clave"]] = cliente
        return clientes

    def _crear_paquetes(self) -> dict[str, Paquete]:
        destinos = {
            "machu": Destino.objects.get(nombre="Machu Picchu", pais="Peru"),
            "amalfi": Destino.objects.get(
                nombre="Costa Amalfitana", pais="Italia"
            ),
            "uyuni": Destino.objects.get(nombre="Uyuni", pais="Bolivia"),
        }

        paquetes: dict[str, Paquete] = {}
        paquetes["machu"], _ = Paquete.objects.update_or_create(
            destino=destinos["machu"],
            nombre="Machu Picchu y Valle Sagrado 6D/5N",
            defaults={
                "descripcion": (
                    "Ciudadela inca, Valle Sagrado y Cusco con guía privado, "
                    "traslados y alojamiento boutique."
                ),
                "duracion_dias": 6,
                "precio_base": Decimal("1490.00"),
                "moneda": "USD",
                "etiquetas": ["peru", "inca", "cultural", "machu-picchu"],
                "activo": True,
            },
        )
        paquetes["amalfi"], _ = Paquete.objects.update_or_create(
            destino=destinos["amalfi"],
            nombre="Costa Amalfitana 7D/6N",
            defaults={
                "descripcion": (
                    "Positano, Amalfi y Ravello con navegación privada, "
                    "gastronomía local y traslados desde Nápoles."
                ),
                "duracion_dias": 7,
                "precio_base": Decimal("1890.00"),
                "moneda": "EUR",
                "etiquetas": ["italia", "europa", "gastronomia", "costa"],
                "activo": True,
            },
        )
        paquetes["uyuni"], _ = Paquete.objects.get_or_create(
            destino=destinos["uyuni"],
            nombre="Salar de Uyuni 4D/3N",
            defaults={
                "descripcion": "Salar, isla Incahuasi y lagunas del altiplano.",
                "duracion_dias": 4,
                "precio_base": Decimal("250.00"),
                "moneda": "USD",
                "etiquetas": ["bolivia", "salar", "naturaleza"],
                "activo": True,
            },
        )
        return paquetes

    def _crear_vuelos(self) -> dict[str, Vuelo]:
        aeropuertos = {
            a.codigo_iata: a
            for a in Aeropuerto.objects.filter(
                codigo_iata__in=["LPB", "VVI", "LIM", "FCO", "EZE"]
            )
        }
        andes, _ = Proveedor.objects.get_or_create(
            nombre="Andes Air Bolivia",
            defaults={"tipo": "aerolinea", "pais": "Bolivia"},
        )
        latam, _ = Proveedor.objects.get_or_create(
            nombre="LATAM Airlines",
            defaults={"tipo": "aerolinea", "pais": "Chile"},
        )

        configuracion = [
            (
                "ob771",
                "OB-771",
                andes,
                "LPB",
                "LIM",
                date(2026, 6, 6),
                8,
                0,
                date(2026, 6, 6),
                11,
                30,
                "320.00",
                30,
            ),
            (
                "la2401",
                "LA-2401",
                latam,
                "LIM",
                "LPB",
                date(2026, 6, 13),
                15,
                0,
                date(2026, 6, 13),
                18,
                30,
                "310.00",
                30,
            ),
            (
                "ob772",
                "OB-772",
                andes,
                "VVI",
                "FCO",
                date(2026, 9, 5),
                22,
                0,
                date(2026, 9, 6),
                16,
                0,
                "980.00",
                40,
            ),
            (
                "la2402",
                "LA-2402",
                latam,
                "FCO",
                "VVI",
                date(2026, 9, 12),
                20,
                0,
                date(2026, 9, 13),
                14,
                0,
                "960.00",
                40,
            ),
            (
                "ob773",
                "OB-773",
                andes,
                "LPB",
                "EZE",
                date(2026, 11, 21),
                9,
                0,
                date(2026, 11, 21),
                15,
                30,
                "410.00",
                30,
            ),
        ]

        vuelos: dict[str, Vuelo] = {}
        for (
            clave,
            numero,
            proveedor,
            origen,
            destino,
            fecha_salida,
            hora_salida,
            min_salida,
            fecha_llegada,
            hora_llegada,
            min_llegada,
            precio,
            cupos,
        ) in configuracion:
            vuelo, _ = Vuelo.objects.update_or_create(
                numero_vuelo=numero,
                salida=_aware(fecha_salida, hora_salida, min_salida),
                defaults={
                    "proveedor": proveedor,
                    "origen": aeropuertos[origen],
                    "destino": aeropuertos[destino],
                    "llegada": _aware(fecha_llegada, hora_llegada, min_llegada),
                    "precio": Decimal(precio),
                    "moneda": "USD",
                    "cupos_totales": cupos,
                    "cupos_disponibles": cupos,
                    "referencia_externa": f"DEMO-{numero}",
                },
            )
            vuelos[clave] = vuelo
        return vuelos

    def _crear_salidas(
        self, paquetes: dict[str, Paquete], vuelos: dict[str, Vuelo]
    ) -> dict[str, PaqueteSalida]:
        salidas: dict[str, PaqueteSalida] = {}
        for paquete, clave, fecha, vuelo_ida, vuelo_vuelta in SALIDAS:
            salida, _ = PaqueteSalida.objects.update_or_create(
                paquete=paquetes[paquete],
                fecha_salida=fecha,
                defaults={
                    "vuelo_ida": vuelos.get(vuelo_ida) if vuelo_ida else None,
                    "vuelo_vuelta": (
                        vuelos.get(vuelo_vuelta) if vuelo_vuelta else None
                    ),
                    "cupos_totales": 20,
                    "cupos_disponibles": 20,
                },
            )
            salidas[clave] = salida
        return salidas

    def _empleados(self) -> dict[str, Usuario | None]:
        return {
            "ventanilla1": Usuario.objects.filter(
                email="ventanilla1@illimanitravel.bo"
            ).first(),
            "ventanilla2": Usuario.objects.filter(
                email="ventanilla2@illimanitravel.bo"
            ).first(),
        }

    def _crear_reservas(
        self,
        clientes: dict[str, Cliente],
        salidas: dict[str, PaqueteSalida],
        empleados: dict[str, Usuario | None],
    ) -> None:
        for datos in RESERVAS:
            salida = salidas[datos["salida"]]
            paquete = salida.paquete
            total = paquete.precio_base * datos["pax"]
            reserva, _ = Reserva.objects.update_or_create(
                codigo=datos["codigo"],
                defaults={
                    "cliente": clientes[datos["cliente"]],
                    "salida": salida,
                    "num_personas": datos["pax"],
                    "estado": Reserva.ESTADO_PAGADA,
                    "total": total,
                    "moneda": paquete.moneda,
                    "canal": datos["canal"],
                    "registrado_por": empleados.get(datos["empleado"]),
                },
            )
            Reserva.objects.filter(pk=reserva.pk).update(
                creada_en=_aware(*datos["creada"])
            )

            tasa = (
                Decimal("6.960000")
                if paquete.moneda == "USD"
                else Decimal("7.700000")
            )
            pago, _ = Pago.objects.update_or_create(
                stripe_payment_id=f"demo_{datos['codigo'].lower()}",
                defaults={
                    "reserva": reserva,
                    "monto": total,
                    "moneda": paquete.moneda,
                    "tipo_cambio_a_bob": tasa,
                    "monto_bob": (total * tasa).quantize(Decimal("0.01")),
                    "metodo": datos["metodo"],
                    "estado": Pago.Estado.APROBADO,
                },
            )
            Pago.objects.filter(pk=pago.pk).update(
                creado_en=_aware(*datos["pagada"])
            )

            for nombres, apellidos, documento in datos["pasajeros"]:
                ReservaPasajero.objects.update_or_create(
                    reserva=reserva,
                    documento_numero=documento,
                    defaults={
                        "nombres": nombres,
                        "apellidos": apellidos,
                        "documento_tipo": "CI",
                    },
                )

    def _recalcular_cupos(
        self, salidas: dict[str, PaqueteSalida]
    ) -> None:
        for salida in salidas.values():
            vendidos = (
                salida.reservas.exclude(estado=Reserva.ESTADO_CANCELADA)
                .aggregate(total=Sum("num_personas"))["total"]
                or 0
            )
            salida.cupos_disponibles = max(
                salida.cupos_totales - vendidos, 0
            )
            salida.save(update_fields=["cupos_disponibles"])

    def _resumen(self, clientes: dict[str, Cliente]) -> None:
        self.stdout.write(
            self.style.SUCCESS("Datos de demostración para reportes cargados.")
        )
        self.stdout.write(
            f"Clientes con cuenta: {len(clientes)} | contraseña: {PASSWORD}"
        )
        self.stdout.write(
            "Vuelos internacionales: "
            f"{Vuelo.objects.filter(referencia_externa__startswith='DEMO-').count()}"
        )
        self.stdout.write(
            "Paquetes internacionales: "
            f"{Paquete.objects.filter(nombre__in=['Machu Picchu y Valle Sagrado 6D/5N', 'Costa Amalfitana 7D/6N']).count()}"
        )
        self.stdout.write(
            "Reservas demo: "
            f"{Reserva.objects.filter(codigo__startswith='RES-DEMO-1').count()}"
        )
        for datos in CLIENTES:
            cliente = clientes[datos["clave"]]
            self.stdout.write(
                f"  {datos['email']}: {cliente.reservas.count()} reservas"
            )
