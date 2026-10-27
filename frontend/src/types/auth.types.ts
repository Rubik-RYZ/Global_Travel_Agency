/** Tipos del dominio de autenticación y usuarios. */
import type { RolNombre } from '@/utils/roles'

export interface Usuario {
  id: number
  email: string
  rol: RolNombre
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
