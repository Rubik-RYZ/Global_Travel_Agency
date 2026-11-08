"""Flujo de respuesta del asistente conversacional (CU10)."""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.ia.models import Conversacion, Intencion, Mensaje, ModeloIA
from apps.ia.permissions import puede_usar_intencion
from apps.ia.services.asistente import (
    _es_afirmativo,
    _es_negativo,
    _extraer_codigo,
    clasificar_por_palabras,
    construir_respuesta,
    ejecutar_pendiente,
    respuesta_denegada,
)
from apps.ia.services.clasificador import obtener_clasificador


def _conversacion_existente(usuario, conversacion_id) -> Conversacion | None:
    """Carga una conversación propia; nunca permite reutilizar la de otro usuario."""
    if not getattr(usuario, "is_authenticated", False) or not conversacion_id:
        return None
    try:
        return Conversacion.objects.get(
            pk=conversacion_id, usuario=usuario, cerrada=False
        )
    except (Conversacion.DoesNotExist, ValueError, TypeError) as exc:
        raise ValidationError(
            {"conversacion_id": "La conversación no existe o no pertenece al usuario."}
        ) from exc


def _persistir_intercambio(
    *,
    usuario,
    texto: str,
    intencion_nombre: str,
    confianza: float,
    respuesta: str,
    conversacion_id=None,
    conversacion: Conversacion | None = None,
    estado: dict | None = None,
) -> Conversacion | None:
    """Guarda el turno completo cuando el usuario tiene sesión."""
    if not getattr(usuario, "is_authenticated", False):
        return None

    with transaction.atomic():
        if conversacion is not None:
            conversacion_actual = (
                Conversacion.objects.select_for_update()
                .get(pk=conversacion.pk, usuario=usuario, cerrada=False)
            )
        elif conversacion_id:
            try:
                conversacion_actual = (
                    Conversacion.objects.select_for_update()
                    .get(pk=conversacion_id, usuario=usuario, cerrada=False)
                )
            except Conversacion.DoesNotExist as exc:
                raise ValidationError(
                    {
                        "conversacion_id": (
                            "La conversación no existe o no pertenece al usuario."
                        )
                    }
                ) from exc
        else:
            conversacion_actual = Conversacion.objects.create(usuario=usuario)

        intencion = Intencion.objects.filter(nombre=intencion_nombre).first()
        modelo = ModeloIA.objects.filter(
            tipo=ModeloIA.TIPO_CLASIFICADOR, activo=True
        ).first()
        valor_confianza = Decimal(str(confianza))

        Mensaje.objects.create(
            conversacion=conversacion_actual,
            emisor=Mensaje.EMISOR_USUARIO,
            texto=texto,
            intencion=intencion,
            confianza=valor_confianza,
            modelo=modelo,
        )
        Mensaje.objects.create(
            conversacion=conversacion_actual,
            emisor=Mensaje.EMISOR_AGENTE,
            texto=respuesta,
            intencion=intencion,
            modelo=modelo,
        )

        if estado is None:
            estado = dict(conversacion_actual.estado_dialogo or {})
        estado = dict(estado)
        estado.update(
            {
                "ultima_intencion": intencion_nombre,
                "ultima_confianza": confianza,
            }
        )
        conversacion_actual.intencion_activa = intencion_nombre
        conversacion_actual.estado_dialogo = estado
        conversacion_actual.save(
            update_fields=["intencion_activa", "estado_dialogo", "ultima_actividad"]
        )
        return conversacion_actual


def procesar_mensaje(usuario, texto: str, conversacion_id=None) -> dict:
    """Clasifica el mensaje, valida el rol, responde y persiste el turno."""
    conversacion = _conversacion_existente(usuario, conversacion_id)
    estado = dict(conversacion.estado_dialogo or {}) if conversacion else {}
    pendiente = estado.get("pendiente")
    manejado = False
    confianza = 0.0

    if pendiente and getattr(usuario, "is_authenticated", False):
        intencion = pendiente.get("intencion", "")
        if _es_afirmativo(texto):
            permitida = puede_usar_intencion(usuario, intencion)
            if permitida:
                respuesta, estado = ejecutar_pendiente(
                    usuario,
                    pendiente,
                    conversacion_id=conversacion.id if conversacion else None,
                )
            else:
                respuesta = respuesta_denegada(usuario, intencion)
                estado = {}
            confianza = 1.0
            manejado = True
        elif _es_negativo(texto):
            respuesta = "Operación cancelada. No se realizó ningún cambio."
            estado = {}
            intencion = pendiente.get("intencion", "fallback")
            confianza = 1.0
            permitida = True
            manejado = True
        else:
            estado.pop("pendiente", None)

    if not manejado:
        clasificador = obtener_clasificador()
        prediccion = clasificador.predecir(texto)
        forzada = clasificar_por_palabras(texto)
        intencion = forzada or prediccion.intencion
        confianza = 0.99 if forzada else prediccion.confianza
        permitida = puede_usar_intencion(usuario, intencion)

        texto_normalizado = texto.lower()
        if (
            intencion == "buscar_reserva"
            and not permitida
            and puede_usar_intencion(usuario, "estado_reserva")
            and (
                _extraer_codigo(texto)
                or "mi reserva" in texto_normalizado
                or "mis reservas" in texto_normalizado
            )
        ):
            intencion = "estado_reserva"
            permitida = True

        if (
            intencion == "consultar_cupos"
            and not permitida
            and puede_usar_intencion(usuario, "consultar_disponibilidad")
        ):
            intencion = "consultar_disponibilidad"
            permitida = True

        if permitida:
            respuesta, estado = construir_respuesta(
                usuario,
                texto,
                intencion,
                estado,
                conversacion.id if conversacion else None,
            )
        else:
            respuesta = respuesta_denegada(usuario, intencion)
            estado = dict(estado or {})
            estado.pop("pendiente", None)

    conversacion = _persistir_intercambio(
        usuario=usuario,
        texto=texto,
        intencion_nombre=intencion,
        confianza=confianza,
        respuesta=respuesta,
        conversacion_id=conversacion_id,
        conversacion=conversacion,
        estado=estado,
    )

    return {
        "respuesta": respuesta,
        "intencion": intencion,
        "confianza": confianza,
        "permitida": permitida,
        "conversacion_id": str(conversacion.id) if conversacion else None,
    }
