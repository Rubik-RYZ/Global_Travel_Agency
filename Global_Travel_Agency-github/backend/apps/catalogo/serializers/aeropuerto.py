"""Capa de esquema del catálogo — aeropuertos (CU3)."""
from rest_framework import serializers

from apps.catalogo.models import Aeropuerto


class AeropuertoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aeropuerto
        fields = ["codigo_iata", "nombre", "destino"]
