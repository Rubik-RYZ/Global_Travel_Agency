"""Rutas raíz del proyecto (prefijo API: /api/v1/)."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from config.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health", health, name="health"),
    path("api/v1/", include("apps.usuarios.urls")),
    path("api/v1/", include("apps.catalogo.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
