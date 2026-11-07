"""Carga el catálogo de intenciones y frases para entrenar el chatbot (CU10).

Uso:
    python manage.py cargar_intenciones_ia

El comando es idempotente: actualiza las intenciones existentes y agrega solo
las frases que todavía no estén registradas.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.ia.models import FraseEntrenamiento, Intencion

INTENCIONES = {
    "saludo": {
        "descripcion": "Abre la conversación o saluda al asistente.",
        "frases": [
            "Hola",
            "Buenos días",
            "Buenas tardes",
            "Buenas noches",
            "Qué tal",
            "Hey, hola",
            "Saludos",
            "Hola, equipo de Illimani",
        ],
    },
    "despedida": {
        "descripcion": "Cierra la conversación o se despide del asistente.",
        "frases": [
            "Adiós",
            "Hasta luego",
            "Nos vemos",
            "Gracias, hasta pronto",
            "Chao",
            "Hasta la próxima",
            "Me despido",
            "Nos hablamos luego",
        ],
    },
    "ayuda": {
        "descripcion": "Pide orientación sobre el asistente o los servicios.",
        "frases": [
            "Necesito ayuda",
            "Qué puedes hacer",
            "Cómo funciona este chat",
            "En qué me puedes ayudar",
            "Muéstrame las opciones",
            "No sé cómo empezar",
            "Dame una mano",
            "Qué servicios ofrecen",
        ],
    },
    "consultar_paquetes": {
        "descripcion": "Consulta el catálogo de paquetes turísticos disponibles.",
        "frases": [
            "Qué paquetes tienen",
            "Muéstrame los viajes disponibles",
            "Quiero ver paquetes turísticos",
            "Qué destinos ofrecen",
            "Lista de paquetes",
            "Opciones de viaje",
            "Tienen tours organizados",
            "Catálogo de paquetes",
        ],
    },
    "consultar_destinos": {
        "descripcion": "Pregunta por destinos y lugares que ofrece la agencia.",
        "frases": [
            "Qué destinos recomiendan",
            "A dónde puedo viajar",
            "Qué lugares tienen",
            "Destinos internacionales",
            "Quiero conocer nuevos lugares",
            "Qué países ofrecen",
            "Opciones de destino",
            "Lugares para visitar",
        ],
    },
    "consultar_precios": {
        "descripcion": "Solicita precios, tarifas o costos de viajes.",
        "frases": [
            "Cuánto cuesta el paquete",
            "Precios de los viajes",
            "Tarifas disponibles",
            "Qué precio tiene Machu Picchu",
            "Cuánto sale viajar a Italia",
            "Precio en bolivianos",
            "Costo del tour",
            "Cuánto está el paquete",
        ],
    },
    "consultar_disponibilidad": {
        "descripcion": "Consulta fechas, salidas o cupos disponibles.",
        "frases": [
            "Hay cupos",
            "Qué fechas están disponibles",
            "Queda espacio para junio",
            "Disponibilidad de salidas",
            "Hay lugar para dos personas",
            "Próximas fechas de salida",
            "Está disponible el paquete",
            "Cuántos cupos quedan",
        ],
    },
    "consultar_incluye": {
        "descripcion": "Pregunta qué servicios incluye o no incluye un paquete.",
        "frases": [
            "Qué incluye el paquete",
            "El precio incluye vuelos",
            "Incluye hotel y comidas",
            "Qué está incluido en el tour",
            "Incluye traslados",
            "El paquete cubre entradas",
            "Qué no incluye",
            "Detalles de lo que incluye",
        ],
    },
    "consultar_duracion": {
        "descripcion": "Consulta la duración en días y noches de un viaje.",
        "frases": [
            "Cuántos días dura",
            "Duración del viaje",
            "Cuántas noches son",
            "Cuánto tiempo es el tour",
            "Duración del paquete a Italia",
            "Son seis días",
            "Cuántos días y noches",
            "Cuánto dura la salida",
        ],
    },
    "consultar_requisitos": {
        "descripcion": "Pregunta por documentos, visas o requisitos de viaje.",
        "frases": [
            "Qué documentos necesito",
            "Se requiere pasaporte",
            "Necesito visa",
            "Requisitos para viajar a Perú",
            "Qué papeles piden",
            "Vacunas obligatorias",
            "Requisitos de ingreso a Italia",
            "Qué debo llevar",
        ],
    },
    "consultar_politicas": {
        "descripcion": "Consulta políticas de cancelación, cambios y condiciones.",
        "frases": [
            "Política de cancelación",
            "Puedo reprogramar",
            "Cuál es la política de devolución",
            "Condiciones del paquete",
            "Penalidad por cancelar",
            "Cambios de fecha",
            "Política de equipaje",
            "Normas del tour",
        ],
    },
    "consultar_formas_pago": {
        "descripcion": "Pregunta por métodos y condiciones de pago.",
        "frases": [
            "Cómo puedo pagar",
            "Aceptan tarjeta",
            "Se puede pagar en efectivo",
            "Formas de pago disponibles",
            "Pago con transferencia",
            "Cuotas o financiamiento",
            "Aceptan QR",
            "Dónde pago la reserva",
        ],
    },
    "consultar_tipo_cambio": {
        "descripcion": "Consulta la cotización o conversión de monedas.",
        "frases": [
            "Tipo de cambio",
            "A cuánto está el dólar",
            "Cambio de USD a bolivianos",
            "Precio del euro hoy",
            "Cuánto es en bolivianos",
            "Tasa de cambio",
            "Cotización del dólar",
            "Conversión de moneda",
        ],
    },
    "recomendar_destino": {
        "descripcion": "Pide una recomendación de viaje según intereses.",
        "frases": [
            "Recomiéndame un destino",
            "Qué viaje me conviene",
            "Ideas para mis vacaciones",
            "Dónde ir en pareja",
            "Destino para familia",
            "Opción económica para viajar",
            "Quiero un viaje de aventura",
            "Qué paquete me sugieres",
        ],
    },
    "comparar_paquetes": {
        "descripcion": "Pide comparar dos o más paquetes.",
        "frases": [
            "Compara Machu Picchu con Italia",
            "Diferencias entre paquetes",
            "Cuál es mejor opción",
            "Qué conviene más",
            "Compara precios y duración",
            "Ventajas de cada viaje",
            "Cuál me recomiendas entre estos",
            "Diferencia entre los tours",
        ],
    },
    "solicitar_promociones": {
        "descripcion": "Consulta ofertas, descuentos o promociones vigentes.",
        "frases": [
            "Hay promociones",
            "Descuentos disponibles",
            "Ofertas de viaje",
            "Promoción para junio",
            "Precio especial",
            "Paquete en oferta",
            "Cupón de descuento",
            "Tarifas promocionales",
        ],
    },
    "hablar_con_agente": {
        "descripcion": "Solicita atención humana o derivación a ventanilla.",
        "frases": [
            "Quiero hablar con una persona",
            "Pásame con un agente",
            "Atención humana",
            "Necesito un asesor",
            "Comunícame con ventanilla",
            "Agente real",
            "Soporte humano",
            "Que me llame un asesor",
        ],
    },
    "iniciar_reserva": {
        "descripcion": "Expresa intención de reservar o contratar un paquete.",
        "frases": [
            "Quiero reservar",
            "Cómo hago una reserva",
            "Quiero comprar el paquete",
            "Reservar dos personas",
            "Empezar una reserva",
            "Apartar mi cupo",
            "Quiero contratar el viaje",
            "Hacer una reserva ahora",
        ],
    },
    "estado_reserva": {
        "descripcion": "Consulta el estado de una reserva propia.",
        "frases": [
            "Estado de mi reserva",
            "Consultar mi reserva",
            "Cómo va mi compra",
            "Mi código de reserva",
            "Ya está confirmado mi viaje",
            "Revisar mi reserva",
            "Información de mi pedido",
            "Mi reserva está pagada",
        ],
    },
    "cancelar_reserva": {
        "descripcion": "Solicita cancelar una reserva.",
        "frases": [
            "Quiero cancelar mi reserva",
            "Anular el viaje",
            "Cancelar la compra",
            "Ya no puedo viajar",
            "Cómo cancelo",
            "Quiero anular mi paquete",
            "Devolución por cancelación",
            "Cancelar dos cupos",
        ],
    },
    "modificar_reserva": {
        "descripcion": "Solicita cambiar fecha, pasajeros u otros datos de una reserva.",
        "frases": [
            "Quiero cambiar mi reserva",
            "Modificar la fecha del viaje",
            "Cambiar cantidad de pasajeros",
            "Actualizar mis datos de reserva",
            "Mover mi salida",
            "Cambiar el paquete",
            "Corregir nombre en la reserva",
            "Modificar mi compra",
        ],
    },
    "fallback": {
        "descripcion": "Mensaje que no se pudo clasificar o queda fuera del alcance.",
        "frases": [
            "No entiendo",
            "No sé",
            "Puedes repetir",
            "No me quedó claro",
            "Eso no responde mi pregunta",
            "Qué dijiste",
            "No comprendo",
            "Estoy confundido",
        ],
    },
    "buscar_reserva": {
        "descripcion": "El equipo interno busca una reserva por código, cliente o documento.",
        "frases": [
            "Buscar reserva por código",
            "Necesito encontrar una reserva",
            "Consultar reserva de un cliente",
            "Ubica la reserva RES-001",
            "Buscar por documento del pasajero",
            "Localiza la compra de Lucía",
        ],
    },
    "consultar_cupos": {
        "descripcion": "El equipo interno consulta cupos o aforo de una salida.",
        "frases": [
            "Cuántos cupos quedan",
            "Disponibilidad de la salida",
            "Cupos vendidos del paquete",
            "Revisar aforo",
            "Qué cupos hay para junio",
            "Cuántos asientos disponibles",
        ],
    },
    "registrar_pago": {
        "descripcion": "El equipo interno registra o cobra un pago.",
        "frases": [
            "Registrar pago en efectivo",
            "Cobrar la reserva",
            "Agregar pago con tarjeta",
            "Registrar transferencia del cliente",
            "Ingresar pago parcial",
            "Confirmar pago de ventanilla",
        ],
    },
    "resumen_ventas": {
        "descripcion": "El administrador consulta ventas e ingresos.",
        "frases": [
            "Resumen de ventas del mes",
            "Cuánto vendimos hoy",
            "Ventas por canal",
            "Total recaudado",
            "Reporte de ingresos",
            "Ventas de la semana",
        ],
    },
    "reporte_ocupacion": {
        "descripcion": "El administrador consulta ocupación de paquetes o salidas.",
        "frases": [
            "Reporte de ocupación",
            "Ocupación de los paquetes",
            "Porcentaje de cupos vendidos",
            "Qué salidas están llenas",
            "Ocupación por destino",
            "Informe de ocupación",
        ],
    },
}


class Command(BaseCommand):
    help = "Carga 27 intenciones y sus frases de entrenamiento para el chatbot."

    @transaction.atomic
    def handle(self, *args, **options):
        intenciones_creadas = 0
        intenciones_actualizadas = 0
        frases_creadas = 0

        for nombre, datos in INTENCIONES.items():
            intencion, creada = Intencion.objects.update_or_create(
                nombre=nombre,
                defaults={
                    "descripcion": datos["descripcion"],
                    "activa": True,
                },
            )
            if creada:
                intenciones_creadas += 1
            else:
                intenciones_actualizadas += 1

            for texto in datos["frases"]:
                _, frase_creada = FraseEntrenamiento.objects.get_or_create(
                    intencion=intencion,
                    texto=texto,
                )
                if frase_creada:
                    frases_creadas += 1

        total_frases = FraseEntrenamiento.objects.filter(
            intencion__nombre__in=INTENCIONES
        ).count()
        self.stdout.write(
            self.style.SUCCESS(
                "Catálogo IA cargado: "
                f"{intenciones_creadas} intenciones nuevas, "
                f"{intenciones_actualizadas} actualizadas, "
                f"{frases_creadas} frases nuevas."
            )
        )
        self.stdout.write(
            f"Total del catálogo: {Intencion.objects.count()} intenciones, "
            f"{total_frases} frases."
        )
