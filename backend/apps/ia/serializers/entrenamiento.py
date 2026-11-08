"""Serializers del panel de entrenamiento del asistente (CU10)."""
from rest_framework import serializers

from apps.ia.models import FraseEntrenamiento, Intencion, ModeloIA


class IntencionAdminSerializer(serializers.ModelSerializer):
    """Intención con el número de frases activas para el panel."""

    total_frases = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Intencion
        fields = ["id", "nombre", "descripcion", "activa", "total_frases"]
        read_only_fields = ["id", "total_frases"]


class FraseEntrenamientoSerializer(serializers.ModelSerializer):
    """Frase etiquetada que alimenta al clasificador."""

    intencion_nombre = serializers.CharField(
        source="intencion.nombre", read_only=True
    )

    class Meta:
        model = FraseEntrenamiento
        fields = [
            "id",
            "intencion",
            "intencion_nombre",
            "texto",
            "origen",
            "creado_en",
        ]
        read_only_fields = ["id", "intencion_nombre", "creado_en"]
        extra_kwargs = {
            "texto": {"max_length": 500, "trim_whitespace": True},
            "origen": {"required": False},
        }

    def validate(self, attrs):
        intencion = attrs.get("intencion", getattr(self.instance, "intencion", None))
        texto = attrs.get("texto", getattr(self.instance, "texto", ""))
        repetida = FraseEntrenamiento.objects.filter(
            intencion=intencion, texto__iexact=texto.strip()
        )
        if self.instance is not None:
            repetida = repetida.exclude(pk=self.instance.pk)
        if repetida.exists():
            raise serializers.ValidationError(
                {"texto": "Esta frase ya está registrada para la intención."}
            )
        return attrs


class ModeloIASerializer(serializers.ModelSerializer):
    """Versión entrenada y sus métricas."""

    class Meta:
        model = ModeloIA
        fields = [
            "id",
            "nombre",
            "version",
            "tipo",
            "metricas",
            "activo",
            "entrenado_en",
        ]
