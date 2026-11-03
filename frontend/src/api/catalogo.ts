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
  logo_url: string | null
  logo_public_id: string | null
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

export interface Aeropuerto {
  codigo_iata: string
  nombre: string
  destino: number
}

export interface Vuelo {
  id: number
  proveedor: number
  proveedor_nombre: string
  numero_vuelo: string
  origen: string
  origen_nombre: string
  destino: string
  destino_nombre: string
  salida: string
  llegada: string
  precio: string
  moneda: string
  cupos_totales: number
  cupos_disponibles: number
  referencia_externa: string | null
}

export interface FiltrosVuelo {
  q?: string
  proveedor?: number
  origen?: string
  destino?: string
  desde?: string
  hasta?: string
  disponibles?: boolean
  page?: number
}

export interface Hotel {
  id: number
  proveedor: number
  proveedor_nombre: string
  destino: number
  destino_nombre: string
  nombre: string
  estrellas: number | null
  direccion: string | null
  latitud: string | null
  longitud: string | null
  descripcion: string | null
  activo: boolean
}

export interface FiltrosHotel {
  q?: string
  proveedor?: number
  destino?: number
  estrellas?: number
  page?: number
}

export interface PaqueteSalida {
  id: number
  paquete: number
  paquete_nombre: string
  fecha_salida: string
  vuelo_ida: number | null
  vuelo_ida_numero: string | null
  vuelo_vuelta: number | null
  vuelo_vuelta_numero: string | null
  cupos_totales: number
  cupos_disponibles: number
}

export interface Paquete {
  id: number
  destino: number
  destino_nombre: string
  hotel: number | null
  hotel_nombre: string | null
  nombre: string
  descripcion: string | null
  duracion_dias: number
  precio_base: string
  moneda: string
  etiquetas: string[]
  activo: boolean
  salidas: PaqueteSalida[]
}

export interface FiltrosPaquete {
  q?: string
  destino?: number
  hotel?: number
  etiqueta?: string
  page?: number
}

export interface FiltrosSalida {
  paquete?: number
  desde?: string
  hasta?: string
  disponibles?: boolean
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

  // ── Aeropuertos ──────────────────────────────────────────────────────────
  listarAeropuertos: (destino?: number, page?: number) =>
    api
      .get<Paginado<Aeropuerto>>('/aeropuertos/', {
        params: { ...(destino ? { destino } : {}), ...(page ? { page } : {}) },
      })
      .then((r) => r.data),

  // ── Vuelos ───────────────────────────────────────────────────────────────
  listarVuelos: (filtros: FiltrosVuelo = {}) =>
    api.get<Paginado<Vuelo>>('/vuelos/', { params: filtros }).then((r) => r.data),

  crearVuelo: (data: Partial<Vuelo>) =>
    api.post<Vuelo>('/vuelos/', data).then((r) => r.data),

  actualizarVuelo: (id: number, data: Partial<Vuelo>) =>
    api.patch<Vuelo>(`/vuelos/${id}/`, data).then((r) => r.data),

  eliminarVuelo: (id: number) => api.delete(`/vuelos/${id}/`),

  // ── Hoteles ──────────────────────────────────────────────────────────────
  listarHoteles: (filtros: FiltrosHotel = {}) =>
    api.get<Paginado<Hotel>>('/hoteles/', { params: filtros }).then((r) => r.data),

  crearHotel: (data: Partial<Hotel>) =>
    api.post<Hotel>('/hoteles/', data).then((r) => r.data),

  actualizarHotel: (id: number, data: Partial<Hotel>) =>
    api.patch<Hotel>(`/hoteles/${id}/`, data).then((r) => r.data),

  toggleActivoHotel: (id: number) =>
    api.post<Hotel>(`/hoteles/${id}/toggle_activo/`).then((r) => r.data),

  eliminarHotel: (id: number) => api.delete(`/hoteles/${id}/`),

  // ── Paquetes ─────────────────────────────────────────────────────────────
  listarPaquetes: (filtros: FiltrosPaquete = {}) =>
    api
      .get<Paginado<Paquete>>('/paquetes/', { params: filtros })
      .then((r) => r.data),

  obtenerPaquete: (id: number) =>
    api.get<Paquete>(`/paquetes/${id}/`).then((r) => r.data),

  crearPaquete: (data: Partial<Paquete>) =>
    api.post<Paquete>('/paquetes/', data).then((r) => r.data),

  actualizarPaquete: (id: number, data: Partial<Paquete>) =>
    api.patch<Paquete>(`/paquetes/${id}/`, data).then((r) => r.data),

  toggleActivoPaquete: (id: number) =>
    api.post<Paquete>(`/paquetes/${id}/toggle_activo/`).then((r) => r.data),

  eliminarPaquete: (id: number) => api.delete(`/paquetes/${id}/`),

  // ── Salidas ──────────────────────────────────────────────────────────────
  listarSalidas: (filtros: FiltrosSalida = {}) =>
    api
      .get<Paginado<PaqueteSalida>>('/salidas/', { params: filtros })
      .then((r) => r.data),

  crearSalida: (data: Partial<PaqueteSalida>) =>
    api.post<PaqueteSalida>('/salidas/', data).then((r) => r.data),

  actualizarSalida: (id: number, data: Partial<PaqueteSalida>) =>
    api.patch<PaqueteSalida>(`/salidas/${id}/`, data).then((r) => r.data),

  eliminarSalida: (id: number) => api.delete(`/salidas/${id}/`),
}
