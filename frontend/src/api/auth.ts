/** Cliente HTTP del dominio de acceso, equipo y auditoría (CU1). */
import { api } from '@/lib/axios'
import type { Paginated } from '@/types/api.types'
import type {
  Auditoria,
  RegistroPayload,
  Rol,
  TokenPair,
  Usuario,
  UsuarioEquipo,
  UsuarioEquipoPayload,
} from '@/types/auth.types'

export interface RespuestaSesion extends TokenPair {
  usuario: Usuario
}

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<RespuestaSesion>('/auth/login', { email, password })
      .then((r) => r.data),

  registro: (payload: RegistroPayload) =>
    api.post<RespuestaSesion>('/auth/registro', payload).then((r) => r.data),

  logout: (refresh: string | null) =>
    api.post('/auth/logout', { refresh }).then((r) => r.data),

  me: () => api.get<Usuario>('/auth/me').then((r) => r.data),

  recuperar: (email: string) =>
    api
      .post<{ mensaje: string }>('/auth/recuperar', { email })
      .then((r) => r.data),

  restablecer: (token: string, password: string) =>
    api
      .post<{ mensaje: string }>('/auth/restablecer', { token, password })
      .then((r) => r.data),

  roles: () => api.get<Rol[]>('/roles/').then((r) => r.data),

  usuarios: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<UsuarioEquipo>>('/usuarios/', { params }).then((r) => r.data),

  crearUsuario: (payload: UsuarioEquipoPayload) =>
    api.post<UsuarioEquipo>('/usuarios/', payload).then((r) => r.data),

  actualizarUsuario: (id: number, payload: Partial<UsuarioEquipoPayload>) =>
    api.patch<UsuarioEquipo>(`/usuarios/${id}/`, payload).then((r) => r.data),

  desactivarUsuario: (id: number) =>
    api.delete(`/usuarios/${id}/`).then((r) => r.data),

  auditoria: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<Auditoria>>('/auditoria/', { params }).then((r) => r.data),
}
