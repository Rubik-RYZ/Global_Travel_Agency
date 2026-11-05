/** Cliente HTTP del dominio de clientes y preferencias (CU2). */
import { api } from '@/lib/axios'
import type { Paginated } from '@/types/api.types'
import type { Usuario } from '@/types/auth.types'
import type {
  Cliente,
  ClientePayload,
  ClientePreferencia,
  PerfilPayload,
  PerfilViajero,
  PreferenciasPayload,
} from '@/types/clientes.types'

export const clientesApi = {
  listar: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<Cliente>>('/clientes/', { params }).then((r) => r.data),

  obtener: (id: number) => api.get<Cliente>(`/clientes/${id}/`).then((r) => r.data),

  crear: (payload: ClientePayload) =>
    api.post<Cliente>('/clientes/', payload).then((r) => r.data),

  actualizar: (id: number, payload: Partial<ClientePayload>) =>
    api.patch<Cliente>(`/clientes/${id}/`, payload).then((r) => r.data),

  eliminar: (id: number) => api.delete(`/clientes/${id}/`).then((r) => r.data),
}

/** Área privada del viajero autenticado. */
export const perfilApi = {
  obtener: () => api.get<PerfilViajero>('/me/perfil').then((r) => r.data),

  actualizar: (payload: PerfilPayload) =>
    api.put<PerfilViajero>('/me/perfil', payload).then((r) => r.data),

  /** Cambios puntuales (p. ej. sólo las láminas) sin reenviar toda la ficha. */
  actualizarParcial: (payload: Partial<PerfilPayload>) =>
    api.patch<PerfilViajero>('/me/perfil', payload).then((r) => r.data),

  /** Retrato propio del usuario (avatar del menú y de «Mi viaje»). */
  guardarFoto: (payload: { foto_url: string | null; foto_public_id: string | null }) =>
    api.patch<Usuario>('/me/foto', payload).then((r) => r.data),

  preferencias: () => api.get<ClientePreferencia>('/me/preferencias').then((r) => r.data),

  guardarPreferencias: (payload: PreferenciasPayload) =>
    api.put<ClientePreferencia>('/me/preferencias', payload).then((r) => r.data),
}
