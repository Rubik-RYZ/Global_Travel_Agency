"""Capa de presentación — panel: roles, equipo y bitácora (CU1)."""
from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.usuarios import services
from apps.usuarios.models import Auditoria, Rol, Usuario
from apps.usuarios.permissions import EsAdministrador, EsPanel
from apps.usuarios.serializers import (
    AuditoriaSerializer,
    RolSerializer,
    UsuarioEquipoSerializer,
)


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Rol.objects.all().order_by("id")
    serializer_class = RolSerializer
    permission_classes = [EsPanel]
    pagination_class = None


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related("rol").order_by("email")
    serializer_class = UsuarioEquipoSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["rol", "activo"]
    search_fields = ["email"]
    ordering_fields = ["email", "creado_en", "ultimo_acceso"]

    def create(self, request, *args, **kwargs):
        entrada = self.get_serializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        usuario = services.crear_usuario_equipo(
            datos=entrada.validated_data, actor=request.user, request=request
        )
        return Response(
            self.get_serializer(usuario).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        usuario = self.get_object()
        entrada = self.get_serializer(usuario, data=request.data, partial=kwargs.pop("partial", False))
        entrada.is_valid(raise_exception=True)
        usuario = services.actualizar_usuario_equipo(
            usuario=usuario, datos=entrada.validated_data,
            actor=request.user, request=request,
        )
        return Response(self.get_serializer(usuario).data)

    def destroy(self, request, *args, **kwargs):
        services.desactivar_usuario_equipo(
            usuario=self.get_object(), actor=request.user, request=request
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Auditoria.objects.select_related("usuario").order_by("-creado_en")
    serializer_class = AuditoriaSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["accion", "usuario", "entidad"]
    search_fields = ["accion", "entidad", "entidad_id"]
    ordering_fields = ["creado_en", "accion"]
