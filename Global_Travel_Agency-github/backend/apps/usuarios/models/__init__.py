"""Capa de dominio: usuarios, seguridad, clientes y preferencias (CU1 + CU2).

Las FK entre apps se declaran SIEMPRE como string para evitar imports
circulares (regla de AGENT.md).

IMPORTANTE: re-exportar TODAS las entidades. Si se olvida una, Django la
considera eliminada y genera una migración que borra su tabla.
"""
from apps.usuarios.models.auditoria import Auditoria
from apps.usuarios.models.cliente import Cliente, ClientePreferencia
from apps.usuarios.models.rol import Rol
from apps.usuarios.models.usuario import Usuario

__all__ = ["Auditoria", "Cliente", "ClientePreferencia", "Rol", "Usuario"]
