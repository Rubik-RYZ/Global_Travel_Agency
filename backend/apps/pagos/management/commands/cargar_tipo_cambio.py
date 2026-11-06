"""Carga manual del tipo de cambio: python manage.py cargar_tipo_cambio USD 12.00"""
from datetime import date
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.pagos.models import Pago
from apps.pagos.services.tipo_cambio import guardar_tasa


class Command(BaseCommand):
    help = "Guarda el tipo de cambio de un día (por defecto hoy) hacia BOB u otra moneda."

    def add_arguments(self, parser):
        parser.add_argument("origen", help="Moneda de origen: USD, EUR o BOB")
        parser.add_argument("tasa", help="Valor, por ejemplo 12.00")
        parser.add_argument("--destino", default="BOB")
        parser.add_argument("--fecha", help="Formato AAAA-MM-DD (por defecto, hoy)")

    def handle(self, *args, **opts):
        validas = {codigo for codigo, _ in Pago.Moneda.choices}
        origen, destino = opts["origen"].upper(), opts["destino"].upper()
        if origen not in validas or destino not in validas or origen == destino:
            raise CommandError(f"Monedas válidas: {', '.join(sorted(validas))} (origen y destino distintos).")

        try:
            tasa = Decimal(opts["tasa"].replace(",", "."))
        except InvalidOperation:
            raise CommandError("La tasa no es un número válido.")
        if tasa <= 0:
            raise CommandError("La tasa debe ser mayor a 0.")

        try:
            fecha = date.fromisoformat(opts["fecha"]) if opts["fecha"] else timezone.localdate()
        except ValueError:
            raise CommandError("Fecha inválida. Usa el formato AAAA-MM-DD.")

        reg = guardar_tasa(fecha=fecha, origen=origen, destino=destino, tasa=tasa)
        self.stdout.write(self.style.SUCCESS(f"{reg.fecha} {origen}->{destino} = {reg.tasa}"))