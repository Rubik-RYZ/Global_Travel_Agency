/**
 * API de catálogo — destinos, aeropuertos, proveedores (CU3).
 */
import { api } from '@/lib/axios'

export interface ItinerarioDia {
  id: number
  numero_dia: number
  titulo: string
  descripcion: string | null
  ubicacion: string | null
}

export interface Destino {
  id: number
  nombre: string
  pais: string
  pais_codigo: string | null
  slug: string | null
  region: string | null
  region_display: string | null
  resumen: string | null
  lema: string | null
  descripcion: string | null
  latitud: string | null
  longitud: string | null
  duracion_dias: number | null
  duracion_noches: number | null
  precio_desde: string | null
  moneda: string
  mejor_epoca: string | null
  caracter: string | null
  caracter_display: string | null
  imagen_principal: string | null
  imagen_public_id: string | null
  incluye: string[]
  no_incluye: string[]
  etiquetas: string[]
  destacado: boolean
  activo: boolean
  itinerario: ItinerarioDia[]
}

export interface DestinoResumen {
  id: number
  nombre: string
  pais: string
  pais_codigo: string | null
  slug: string | null
  region: string | null
  region_display: string | null
  resumen: string | null
  latitud: string | null
  longitud: string | null
  duracion_dias: number | null
  duracion_noches: number | null
  precio_desde: string | null
  moneda: string
  mejor_epoca: string | null
  caracter: string | null
  caracter_display: string | null
  imagen_principal: string | null
  etiquetas: string[]
  destacado: boolean
}

export interface Proveedor {
  id: number
  nombre: string
  tipo: string
  tipo_display: string
  pais: string | null
  ciudad: string | null
  contacto: string | null
  email: string | null
  telefono: string | null
  notas: string | null
  activo: boolean
}

interface Paginado<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface FiltrosDestino {
  q?: string
  pais?: string
  region?: string
  caracter?: string
  etiqueta?: string
  destacado?: boolean
  page?: number
}

export interface FiltrosProveedor {
  q?: string
  tipo?: string
  pais?: string
  page?: number
}

export const catalogoApi = {
  // ── Destinos ────────────────────────────────────────────────────────────
  listarDestinos: (filtros: FiltrosDestino = {}) =>
    api.get<Paginado<DestinoResumen>>('/destinos/', { params: filtros }).then((r) => r.data),

  /**
   * Listado para el panel: el personal recibe el destino completo (con
   * `activo`, `incluye`, `itinerario`…), a diferencia del resumen público.
   */
  listarDestinosAdmin: (filtros: FiltrosDestino = {}) =>
    api.get<Paginado<Destino>>('/destinos/', { params: filtros }).then((r) => r.data),

  listarDestacados: (filtros: FiltrosDestino = {}) =>
    api
      .get<Paginado<DestinoResumen>>('/destinos/', { params: { ...filtros, destacado: true } })
      .then((r) => r.data),

  obtenerDestino: (id: number) =>
    api.get<Destino>(`/destinos/${id}/`).then((r) => r.data),

  crearDestino: (data: Partial<Destino>) =>
    api.post<Destino>('/destinos/', data).then((r) => r.data),

  actualizarDestino: (id: number, data: Partial<Destino>) =>
    api.patch<Destino>(`/destinos/${id}/`, data).then((r) => r.data),

  toggleActivoDestino: (id: number) =>
    api.post<Destino>(`/destinos/${id}/toggle_activo/`).then((r) => r.data),

  /** Reemplaza el diario de ruta (día a día) del destino. */
  definirItinerario: (id: number, dias: Omit<ItinerarioDia, 'id'>[]) =>
    api.put<ItinerarioDia[]>(`/destinos/${id}/itinerario/`, dias).then((r) => r.data),

  // ── Proveedores ──────────────────────────────────────────────────────────
  listarProveedores: (filtros: FiltrosProveedor = {}) =>
    api.get<Paginado<Proveedor>>('/proveedores/', { params: filtros }).then((r) => r.data),

  obtenerProveedor: (id: number) =>
    api.get<Proveedor>(`/proveedores/${id}/`).then((r) => r.data),

  crearProveedor: (data: Partial<Proveedor>) =>
    api.post<Proveedor>('/proveedores/', data).then((r) => r.data),

  actualizarProveedor: (id: number, data: Partial<Proveedor>) =>
    api.patch<Proveedor>(`/proveedores/${id}/`, data).then((r) => r.data),

  toggleActivoProveedor: (id: number) =>
    api.post<Proveedor>(`/proveedores/${id}/toggle_activo/`).then((r) => r.data),
}
