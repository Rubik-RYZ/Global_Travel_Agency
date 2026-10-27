"""Capa de presentación de CU1 · Seguridad y acceso.

ViewSets delgados: reciben la petición, delegan en `services.py` y devuelven
la respuesta. Los endpoints de acceso usan APIView por no ser CRUD.
"""
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from apps.usuarios import services
from apps.usuarios.models import Auditoria, Rol, Usuario
from apps.usuarios.permissions import EsAdministrador, EsPanel
from apps.usuarios.serializers import (
    AuditoriaSerializer,
    LoginSerializer,
    LogoutSerializer,
    RecuperarSerializer,
    RegistroSerializer,
    RestablecerSerializer,
    RolSerializer,
    UsuarioEquipoSerializer,
    UsuarioSerializer,
)


# ---------------------------------------------------------------------
# Acceso (no-CRUD → APIView justificado)
# ---------------------------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        entrada = LoginSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        usuario, tokens = services.autenticar(request=request, **entrada.validated_data)
        return Response({**tokens, "usuario": UsuarioSerializer(usuario).data})


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        entrada = TokenRefreshSerializer(data=request.data)
        try:
            entrada.is_valid(raise_exception=True)
        except TokenError as exc:
            # Token vencido, malformado o revocado (blacklist) → 401 claro.
            raise InvalidToken("El token de refresco no es válido o fue revocado.") from exc
        return Response(entrada.validated_data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        entrada = LogoutSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        services.cerrar_sesion(
            usuario=request.user,
            refresh_token=entrada.validated_data.get("refresh"),
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class RegistroView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        entrada = RegistroSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        usuario, _cliente = services.registrar_cliente(
            request=request, **entrada.validated_data
        )
        tokens = services.generar_tokens(usuario)
        return Response(
            {**tokens, "usuario": UsuarioSerializer(usuario).data},
            status=status.HTTP_201_CREATED,
        )


class RecuperarView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        entrada = RecuperarSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        services.solicitar_recuperacion(request=request, **entrada.validated_data)
        # Respuesta genérica: no revela si el email está registrado.
        return Response(
            {"mensaje": "Si el email está registrado, recibirás un enlace de recuperación."}
        )


class RestablecerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        entrada = RestablecerSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        services.restablecer_password(request=request, **entrada.validated_data)
        return Response({"mensaje": "Contraseña actualizada. Ya puedes iniciar sesión."})


# ---------------------------------------------------------------------
# Panel · roles, equipo y bitácora
# ---------------------------------------------------------------------
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
