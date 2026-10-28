"""Tests del API de almacén externo (Fase 3b).

Las subidas se simulan (`cloudinary.uploader.upload`) para no gastar cuota ni
depender de la red: aquí se prueba la validación, los permisos y —sobre todo—
que **sin credenciales el sistema responde con un mensaje claro y no con 500**.
"""
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.usuarios.constants import ROL_ADMINISTRADOR, ROL_CLIENTE
from apps.usuarios.models import Rol, Usuario

BASE = "/api/v1/almacen"
ROL_AGENTE = 2

CREDENCIALES = {
    "CLOUDINARY_CLOUD_NAME": "demo",
    "CLOUDINARY_API_KEY": "123456789012345",
    "CLOUDINARY_API_SECRET": "secreto",
}

RESPUESTA_CLOUDINARY = {
    "secure_url": "https://res.cloudinary.com/demo/image/upload/illimani/destinos/x.jpg",
    "public_id": "illimani/destinos/x",
    "format": "jpg",
    "width": 1200,
    "height": 800,
    "bytes": 24000,
}


# ── Fixtures ─────────────────────────────────────────────────────────────────
@pytest.fixture
def roles(db):
    Rol.objects.get_or_create(id=ROL_ADMINISTRADOR, defaults={"nombre": "administrador"})
    Rol.objects.get_or_create(id=ROL_AGENTE, defaults={"nombre": "agente"})
    Rol.objects.get_or_create(id=ROL_CLIENTE, defaults={"nombre": "cliente"})


@pytest.fixture
def admin(db, roles):
    return Usuario.objects.create_user(
        email="admin_alm@test.bo", password="Admin12345", rol_id=ROL_ADMINISTRADOR
    )


@pytest.fixture
def cliente_usr(db, roles):
    return Usuario.objects.create_user(
        email="cliente_alm@test.bo", password="Test12345", rol_id=ROL_CLIENTE
    )


@pytest.fixture
def agente(db, roles):
    return Usuario.objects.create_user(
        email="agente_alm@test.bo", password="Test12345", rol_id=ROL_AGENTE
    )


@pytest.fixture
def client_admin(admin):
    c = APIClient()
    c.force_authenticate(user=admin)
    return c


@pytest.fixture
def client_cliente(cliente_usr):
    c = APIClient()
    c.force_authenticate(user=cliente_usr)
    return c


def imagen(nombre: str = "lamina.jpg", contenido: bytes = b"\xff\xd8\xff\xe0datos"):
    return SimpleUploadedFile(nombre, contenido, content_type="image/jpeg")


# ── Estado ───────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_estado_sin_credenciales(client_admin):
    r = client_admin.get(f"{BASE}/estado/")
    assert r.status_code == 200
    assert r.json()["configurado"] is False
    assert "destinos" in [c["clave"] for c in r.json()["carpetas"]]


@pytest.mark.django_db
@pytest.mark.parametrize("clave", sorted(CREDENCIALES))
def test_estado_con_credenciales(client_admin, clave, settings):
    """Con las tres credenciales puestas el panel sabe que puede subir."""
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_admin.get(f"{BASE}/estado/")
    assert r.status_code == 200
    assert r.json()["configurado"] is True


# ── Subida ───────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_subir_sin_credenciales_no_revienta(client_admin, settings):
    """Sin credenciales responde 503 con explicación, no un 500."""
    settings.CLOUDINARY_CLOUD_NAME = ""
    settings.CLOUDINARY_API_KEY = ""
    settings.CLOUDINARY_API_SECRET = ""

    r = client_admin.post(
        f"{BASE}/subir/", {"archivo": imagen(), "carpeta": "destinos"}, format="multipart"
    )
    assert r.status_code == 503
    assert r.json()["code"] == "almacen_no_configurado"
    assert "CLOUDINARY" in r.json()["detail"]


@pytest.mark.django_db
def test_subir_imagen_ok(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)

    with patch(
        "apps.almacen.services.cloudinary.uploader.upload",
        return_value=RESPUESTA_CLOUDINARY,
    ) as simulado:
        r = client_admin.post(
            f"{BASE}/subir/",
            {"archivo": imagen(), "carpeta": "destinos"},
            format="multipart",
        )

    assert r.status_code == 201, r.json()
    cuerpo = r.json()
    assert cuerpo["url"].startswith("https://res.cloudinary.com/")
    assert cuerpo["public_id"] == "illimani/destinos/x"
    assert cuerpo["carpeta_clave"] == "destinos"
    # La carpeta destino viaja al almacén sin que el frontend escriba rutas.
    assert simulado.call_args.kwargs["folder"] == "illimani/destinos"


@pytest.mark.django_db
def test_subir_sin_archivo(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_admin.post(f"{BASE}/subir/", {"carpeta": "destinos"}, format="multipart")
    assert r.status_code == 400
    assert "archivo" in r.json()


@pytest.mark.django_db
def test_subir_carpeta_invalida(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_admin.post(
        f"{BASE}/subir/", {"archivo": imagen(), "carpeta": "privado"}, format="multipart"
    )
    assert r.status_code == 400
    assert "carpeta" in r.json()


@pytest.mark.django_db
def test_subir_formato_no_admitido(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    archivo = SimpleUploadedFile("notas.txt", b"hola", content_type="text/plain")
    r = client_admin.post(
        f"{BASE}/subir/", {"archivo": archivo, "carpeta": "destinos"}, format="multipart"
    )
    assert r.status_code == 400
    assert "archivo" in r.json()


@pytest.mark.django_db
def test_subir_archivo_demasiado_grande(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    pesado = SimpleUploadedFile("grande.jpg", b"x" * (9 * 1024 * 1024), content_type="image/jpeg")
    r = client_admin.post(
        f"{BASE}/subir/", {"archivo": pesado, "carpeta": "destinos"}, format="multipart"
    )
    assert r.status_code == 400
    assert "8 MB" in r.json()["archivo"][0]


@pytest.mark.django_db
def test_cliente_sube_sus_laminas_personales(client_cliente, settings):
    """El viajero digitaliza su retrato y sus documentos desde «Mi viaje»."""
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    respuesta = dict(RESPUESTA_CLOUDINARY)
    respuesta["public_id"] = "illimani/clientes/perfiles/ana"
    with patch(
        "apps.almacen.services.cloudinary.uploader.upload",
        return_value=respuesta,
    ) as simulado:
        r = client_cliente.post(
            f"{BASE}/subir/",
            {"archivo": imagen(), "carpeta": "perfiles"},
            format="multipart",
        )
    assert r.status_code == 201, r.json()
    assert r.json()["carpeta_clave"] == "perfiles"
    assert simulado.call_args.kwargs["folder"] == "illimani/clientes/perfiles"


@pytest.mark.django_db
def test_cliente_no_sube_a_carpetas_del_panel(client_cliente, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_cliente.post(
        f"{BASE}/subir/", {"archivo": imagen(), "carpeta": "destinos"}, format="multipart"
    )
    assert r.status_code == 400
    assert "carpeta" in r.json()


@pytest.mark.django_db
def test_fallo_del_almacen_no_es_500(client_admin, settings):
    """Si Cloudinary falla, el panel recibe un 400 legible."""
    from cloudinary.exceptions import Error as CloudinaryError

    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    with patch(
        "apps.almacen.services.cloudinary.uploader.upload",
        side_effect=CloudinaryError("cuota agotada"),
    ):
        r = client_admin.post(
            f"{BASE}/subir/",
            {"archivo": imagen(), "carpeta": "destinos"},
            format="multipart",
        )
    assert r.status_code == 400
    assert "archivo" in r.json()


# ── Borrado ──────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_eliminar_solo_del_proyecto(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_admin.post(
        f"{BASE}/eliminar/", {"public_id": "otra-cuenta/secreto"}, format="json"
    )
    assert r.status_code == 400
    assert "public_id" in r.json()


@pytest.mark.django_db
def test_eliminar_ok(client_admin, settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    with patch("apps.almacen.services.cloudinary.uploader.destroy") as simulado:
        r = client_admin.post(
            f"{BASE}/eliminar/",
            {"public_id": "illimani/destinos/vieja"},
            format="json",
        )
    assert r.status_code == 200
    assert r.json()["borrado"] is True
    simulado.assert_called_once()


@pytest.mark.django_db
def test_eliminar_sin_credenciales(client_admin, settings):
    settings.CLOUDINARY_CLOUD_NAME = ""
    r = client_admin.post(
        f"{BASE}/eliminar/", {"public_id": "illimani/destinos/vieja"}, format="json"
    )
    assert r.status_code == 503


@pytest.mark.django_db
def test_agente_puede_reemplazar_su_lamina(agente, settings):
    """El agente que edita un destino puede retirar la lámina reemplazada."""
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    cliente = APIClient()
    cliente.force_authenticate(user=agente)
    with patch("apps.almacen.services.cloudinary.uploader.destroy"):
        r = cliente.post(
            f"{BASE}/eliminar/",
            {"public_id": "illimani/destinos/vieja"},
            format="json",
        )
    assert r.status_code == 200


@pytest.mark.django_db
def test_cliente_no_retira_laminas_ajenas(client_cliente, settings):
    """El viajero sólo puede retirar láminas de sus carpetas personales."""
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = client_cliente.post(
        f"{BASE}/eliminar/", {"public_id": "illimani/destinos/vieja"}, format="json"
    )
    assert r.status_code == 400
    assert "public_id" in r.json()


@pytest.mark.django_db
def test_cliente_retira_su_propia_lamina(client_cliente, settings):
    """Al reemplazar su retrato, el viajero no deja huérfanos en el almacén."""
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    with patch("apps.almacen.services.cloudinary.uploader.destroy") as simulado:
        r = client_cliente.post(
            f"{BASE}/eliminar/",
            {"public_id": "illimani/clientes/perfiles/ana-vieja"},
            format="json",
        )
    assert r.status_code == 200
    assert r.json()["borrado"] is True
    simulado.assert_called_once()


@pytest.mark.django_db
def test_anon_no_puede_eliminar(settings):
    for k, v in CREDENCIALES.items():
        setattr(settings, k, v)
    r = APIClient().post(
        f"{BASE}/eliminar/",
        {"public_id": "illimani/clientes/perfiles/ana"},
        format="json",
    )
    assert r.status_code in (401, 403)
