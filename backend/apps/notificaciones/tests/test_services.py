"""Tests del correo transaccional (Fase 3b).

Ningún envío sale a la red: `resend.Emails.send` se sustituye por un doble. Se
comprueba lo importante para la casa: **sin credenciales el sistema no falla**,
deja rastro en la bitácora y el correo queda escrito en el log.
"""
from unittest.mock import patch

import pytest

from apps.notificaciones import plantillas, services
from apps.usuarios.constants import ROL_CLIENTE
from apps.usuarios.models import Auditoria, Rol, Usuario


@pytest.fixture
def roles(db):
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})


@pytest.fixture
def viajero(db, roles):
    return Usuario.objects.create_user(
        email="viajero@test.bo", password="Test12345", rol_id=ROL_CLIENTE
    )


def acciones() -> list[str]:
    return list(Auditoria.objects.values_list("accion", flat=True))


# ── Estado ───────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_sin_clave_no_esta_configurado(settings):
    settings.RESEND_API_KEY = ""
    assert services.correo_configurado() is False


@pytest.mark.django_db
def test_con_clave_esta_configurado(settings):
    settings.RESEND_API_KEY = "re_prueba"
    assert services.correo_configurado() is True


# ── Envío base ───────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_sin_clave_omite_pero_no_falla(viajero, settings):
    settings.RESEND_API_KEY = ""

    with patch("resend.Emails.send") as simulado:
        resultado = services.enviar(
            para=viajero.email,
            asunto="Prueba",
            html="<p>hola</p>",
            usuario=viajero,
            evento="prueba",
        )

    assert resultado is False
    simulado.assert_not_called()
    assert "correo_omitido" in acciones()


@pytest.mark.django_db
def test_con_clave_envia_y_audita(viajero, settings):
    settings.RESEND_API_KEY = "re_prueba"
    settings.DEFAULT_FROM_EMAIL = "onboarding@resend.dev"

    with patch("resend.Emails.send") as simulado:
        resultado = services.enviar(
            para=viajero.email,
            asunto="Prueba",
            html="<p>hola</p>",
            usuario=viajero,
            evento="prueba",
        )

    assert resultado is True
    enviado = simulado.call_args.args[0]
    assert enviado["to"] == [viajero.email]
    assert enviado["from"] == "onboarding@resend.dev"
    assert enviado["subject"] == "Prueba"
    assert "correo_enviado" in acciones()


@pytest.mark.django_db
def test_fallo_del_proveedor_no_falla_al_usuario(viajero, settings):
    """Un rechazo de Resend (p. ej. destinatario no verificado) no rompe el flujo."""
    settings.RESEND_API_KEY = "re_prueba"

    with patch("resend.Emails.send", side_effect=RuntimeError("dominio no verificado")):
        resultado = services.enviar(
            para="otro@test.bo", asunto="Prueba", html="<p>hola</p>", usuario=viajero
        )

    assert resultado is False
    assert "correo_fallido" in acciones()


@pytest.mark.django_db
def test_sin_destinatario_no_hace_nada(settings):
    settings.RESEND_API_KEY = "re_prueba"
    with patch("resend.Emails.send") as simulado:
        assert services.enviar(para="  ", asunto="x", html="y") is False
    simulado.assert_not_called()


# ── Eventos ──────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_bienvenida_lleva_asunto_y_marca(viajero, settings):
    settings.RESEND_API_KEY = "re_prueba"
    with patch("resend.Emails.send") as simulado:
        services.bienvenida_cliente(usuario=viajero, nombres="Ana")
    enviado = simulado.call_args.args[0]
    assert "Bienvenido" in enviado["subject"]
    assert "Illimani Global Travel" in enviado["html"]
    assert "Ana" in enviado["html"]


@pytest.mark.django_db
def test_recuperacion_incluye_enlace(viajero, settings):
    settings.RESEND_API_KEY = "re_prueba"
    enlace = "http://localhost:5173/restablecer?token=abc123"
    with patch("resend.Emails.send") as simulado:
        services.recuperacion_password(usuario=viajero, enlace=enlace)
    enviado = simulado.call_args.args[0]
    assert enlace in enviado["html"]
    assert enlace in enviado["text"]


@pytest.mark.django_db
def test_password_restablecido_avisa(viajero, settings):
    settings.RESEND_API_KEY = "re_prueba"
    with patch("resend.Emails.send") as simulado:
        services.password_restablecido(usuario=viajero)
    enviado = simulado.call_args.args[0]
    assert "actualizada" in enviado["subject"]
    assert "contacto@illimanitravel.bo" in enviado["html"]


@pytest.mark.django_db
def test_ficha_viajero_sin_usuario_no_envia(settings):
    """Un viajero dado de alta presencialmente (sin cuenta) no recibe correo."""
    settings.RESEND_API_KEY = "re_prueba"

    class SinCorreo:
        nombre_completo = "Sin Cuenta"
        documento_numero = None

    with patch("resend.Emails.send") as simulado:
        assert services.ficha_viajero_abierta(cliente=SinCorreo()) is False
    simulado.assert_not_called()


# ── Plantillas ───────────────────────────────────────────────────────────────
def test_plantillas_usan_la_paleta_de_la_casa():
    html = plantillas.bienvenida(nombres="Ana")
    assert plantillas.VERDE_BOSQUE in html
    assert plantillas.TERRACOTA in html
    # Las fuentes web no son fiables en clientes de correo: se usan reservas.
    assert "Georgia" in html
    assert "Helvetica" in html
