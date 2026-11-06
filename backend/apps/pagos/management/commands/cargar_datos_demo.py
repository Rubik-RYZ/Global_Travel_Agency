from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.catalogo.models import Destino, Paquete, PaqueteSalida
from apps.reservas.models import Reserva
from apps.usuarios.models import Cliente, Rol, Usuario


class Command(BaseCommand):
    help = "Crea datos de demo (usuario, cliente, paquete, salida y reserva) sin duplicar."

    @transaction.atomic
    def handle(self, *args, **options):
        rol, _ = Rol.objects.get_or_create(nombre="cliente")

        usuario, creado = Usuario.objects.get_or_create(
            email="demo@illimani.test",
            defaults={"rol": rol},
        )
        if creado:
            usuario.set_password("Demo12345")
            usuario.save()

        cliente, _ = Cliente.objects.get_or_create(
            usuario=usuario,
            defaults={"nombres": "Ana", "apellidos": "Demo"},
        )

        destino, _ = Destino.objects.get_or_create(
            nombre="Uyuni",
            defaults={"pais": "Bolivia"},
        )

        paquete, _ = Paquete.objects.get_or_create(
            destino=destino,
            nombre="Salar de Uyuni 4D/3N",
            defaults={"duracion_dias": 4, "precio_base": 250},
        )

        salida, _ = PaqueteSalida.objects.get_or_create(
            paquete=paquete,
            fecha_salida=timezone.localdate() + timedelta(days=30),
            defaults={"cupos_totales": 20, "cupos_disponibles": 18},
        )

        reserva, _ = Reserva.objects.get_or_create(
            codigo="RES-DEMO-001",
            defaults={
                "cliente": cliente,
                "salida": salida,
                "num_personas": 2,
                "total": 500,
                "moneda": "USD",
            },
        )

        self.stdout.write(
            f"Reserva id={reserva.id} codigo={reserva.codigo} "
            f"total={reserva.total} {reserva.moneda} estado={reserva.estado}"
        )