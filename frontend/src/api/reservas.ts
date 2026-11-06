/**
 * Servicios de API para Reservas, Itinerarios y Notificaciones (CU7 · CU8).
 */
import { api } from '@/lib/axios'
import type {
  CrearReservaPayload,
  Itinerario,
  ItinerarioItem,
  Notificacion,
  Reserva,
} from '@/types/reserva.types'

export interface Paginado<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface FiltrosReserva {
  cliente_id?: number
  estado?: string
  canal?: string
  q?: string
  page?: number
}

export const reservasApi = {
  // ── CU7: Reservas ────────────────────────────────────────────────────────
  listarReservas: (filtros: FiltrosReserva = {}) =>
    api.get<Paginado<Reserva>>('/reservas/', { params: filtros }).then((r) => r.data),

  obtenerReserva: (id: number) =>
    api.get<Reserva>(`/reservas/${id}/`).then((r) => r.data),

  crearReserva: (data: CrearReservaPayload) =>
    api.post<Reserva>('/reservas/', data).then((r) => r.data),

  cancelarReserva: (id: number) =>
    api.post<Reserva>(`/reservas/${id}/cancelar/`).then((r) => r.data),

  // ── CU8: Itinerarios ─────────────────────────────────────────────────────
  obtenerItinerario: (id: number) =>
    api.get<Itinerario>(`/itinerarios/${id}/`).then((r) => r.data),

  obtenerItinerarioPorReserva: (reservaId: number) =>
    api.get<Itinerario>(`/itinerarios/por_reserva/${reservaId}/`).then((r) => r.data),

  editarActividadesItinerario: (itinerarioId: number, items: ItinerarioItem[]) =>
    api.put<Itinerario>(`/itinerarios/${itinerarioId}/editar_actividades/`, { items }).then((r) => r.data),

  // ── CU8: Notificaciones ──────────────────────────────────────────────────
  listarNotificaciones: () =>
    api.get<Paginado<Notificacion>>('/notificaciones/').then((r) => r.data),
}

