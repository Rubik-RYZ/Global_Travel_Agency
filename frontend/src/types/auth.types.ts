/** Tipos del dominio de autenticación, equipo y auditoría (CU1). */
import type { RolNombre } from '@/utils/roles'

export interface Usuario {
  id: number
  email: string
  rol: RolNombre
  rol_id: number
  activo: boolean
  ultimo_acceso: string | null
  creado_en: string
}

export interface CredencialesLogin {
  email: string
  password: string
}

export interface RegistroPayload {
  email: string
  password: string
  nombres: string
  apellidos: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface Rol {
  id: number
  nombre: RolNombre
}

export interface UsuarioEquipo {
  id: number
  email: string
  rol: RolNombre
  rol_id: number
  activo: boolean
  ultimo_acceso: string | null
  creado_en: string
}

export interface UsuarioEquipoPayload {
  email: string
  rol_id: number
  activo?: boolean
  password?: string
}

export interface Auditoria {
  id: number
  usuario: number | null
  usuario_email: string | null
  accion: string
  entidad: string | null
  entidad_id: string | null
  detalle: Record<string, unknown> | null
  ip: string | null
  creado_en: string
}
