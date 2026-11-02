"""Capa de presentación — clientes y preferencias (CU2)."""
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios import services
from apps.usuarios.models import Cliente
from apps.usuarios.permissions import EsAdministradorOLectura, EsCliente
from apps.usuarios.serializers import (
    ClientePreferenciaSerializer,
    ClienteSerializer,
    FotoUsuarioSerializer,
    PerfilClienteSerializer,
    UsuarioSerializer,
)


class ClienteViewSet(viewsets.ModelViewSet):
    """Directorio de viajeros (panel): lectura para admin/agente, alta/edición/baja solo admin."""

    queryset = Cliente.objects.select_related("usuario").order_by("apellidos", "nombres")
    serializer_class = ClienteSerializer
    permission_classes = [EsAdministradorOLectura]
    filterset_fields = ["documento_tipo", "pais_origen"]
    search_fields = ["nombres", "apellidos", "documento_numero", "usuario__email"]
    ordering_fields = ["nombres", "apellidos", "creado_en"]

    def create(self, request, *args, **kwargs):
        entrada = self.get_serializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        cliente = services.crear_cliente(
            datos=entrada.validated_data, actor=request.user, request=request
        )
        return Response(
            self.get_serializer(cliente).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        cliente = self.get_object()
        parcial = kwargs.pop("partial", False)
        entrada = self.get_serializer(cliente, data=request.data, partial=parcial)
        entrada.is_valid(raise_exception=True)
        cliente = services.actualizar_cliente(
            cliente=cliente,
            datos=entrada.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(self.get_serializer(cliente).data)

    def destroy(self, request, *args, **kwargs):
        services.eliminar_cliente(
            cliente=self.get_object(), actor=request.user, request=request
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MiPerfilView(APIView):
    """Perfil del viajero autenticado (área «Mi viaje»): GET y PUT/PATCH."""

    permission_classes = [EsCliente]

    def get(self, request):
        cliente = services.obtener_o_crear_cliente(usuario=request.user)
        return Response(PerfilClienteSerializer(cliente).data)

    def put(self, request):
        return self._guardar(request, parcial=False)

    def patch(self, request):
        return self._guardar(request, parcial=True)

    def _guardar(self, request, *, parcial: bool):
        cliente = services.obtener_o_crear_cliente(usuario=request.user)
        entrada = PerfilClienteSerializer(cliente, data=request.data, partial=parcial)
        entrada.is_valid(raise_exception=True)
        cliente = services.actualizar_cliente(
            cliente=cliente,
            datos=entrada.validated_data,
            actor=request.user,
            request=request,
            accion="perfil_actualizado",
        )
        return Response(PerfilClienteSerializer(cliente).data)


class MiFotoView(APIView):
    """Retrato propio del usuario autenticado (área «Mi viaje» y panel)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        entrada = FotoUsuarioSerializer(data=request.data, partial=True)
        entrada.is_valid(raise_exception=True)
        usuario = services.actualizar_foto_usuario(
            usuario=request.user,
            datos=entrada.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(UsuarioSerializer(usuario).data)


class MisPreferenciasView(APIView):
    """Preferencias del viajero autenticado: GET y PUT/PATCH."""

    permission_classes = [EsCliente]

    def get(self, request):
        cliente = services.obtener_o_crear_cliente(usuario=request.user)
        preferencias = services.obtener_preferencias(cliente=cliente)
        return Response(ClientePreferenciaSerializer(preferencias).data)

    def put(self, request):
        return self._guardar(request, parcial=False)

    def patch(self, request):
        return self._guardar(request, parcial=True)

    def _guardar(self, request, *, parcial: bool):
        cliente = services.obtener_o_crear_cliente(usuario=request.user)
        preferencias = services.obtener_preferencias(cliente=cliente)
        entrada = ClientePreferenciaSerializer(
            preferencias, data=request.data, partial=parcial
        )
        entrada.is_valid(raise_exception=True)
        preferencias = services.actualizar_preferencias_cliente(
            cliente=cliente,
            datos=entrada.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(ClientePreferenciaSerializer(preferencias).data)
