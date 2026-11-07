"""Endpoint del asistente conversacional (CU10)."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ia.serializers import MensajeEntradaSerializer, RespuestaChatSerializer
from apps.ia.services import procesar_mensaje


class ChatView(APIView):
    """Clasifica el mensaje y responde según el rol del usuario."""

    permission_classes = [AllowAny]

    def post(self, request):
        entrada = MensajeEntradaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)

        resultado = procesar_mensaje(
            request.user,
            entrada.validated_data["mensaje"],
        )
        return Response(RespuestaChatSerializer(resultado).data)
