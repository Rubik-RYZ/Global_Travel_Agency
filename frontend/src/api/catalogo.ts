/**
 * API de catálogo — destinos, aeropuertos, proveedores, vuelos, hoteles, paquetes (CU3, CU4, CU5, CU6).
 */
import { api } from '@/lib/axios'
import type {
  Aeropuerto,
  CrearHabitacionPayload,
  CrearHotelPayload,
  CrearPaquetePayload,
  CrearSalidaPayload,
  CrearVueloPayload,
  Habitacion,
  Hotel,
  Paquete,
  PaqueteSalida,
  Vuelo,
} from '@/types/catalogo.types'

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

export interface Paginado<T> {
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

export interface FiltrosVuelo {
  origen?: string
  destino?: string
  fecha_salida?: string
  proveedor_id?: number
  solo_disponibles?: boolean
  q?: string
  page?: number
}

export interface FiltrosHotel {
  destino_id?: number
  proveedor_id?: number
  solo_activos?: boolean
  estrellas?: number
  q?: string
  page?: number
}

export interface FiltrosPaquete {
  destino_id?: number
  solo_activos?: boolean
  q?: string
  page?: number
}

export interface FiltrosSalida {
  paquete_id?: number
  desde?: string
  solo_con_cupo?: boolean
  page?: number
}

export const catalogoApi = {
  // ── Destinos ────────────────────────────────────────────────────────────
  listarDestinos: (filtros: FiltrosDestino = {}) =>
    api.get<Paginado<DestinoResumen>>('/destinos/', { params: filtros }).then((r) => r.data),

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

  definirItinerario: (id: number, dias: Omit<ItinerarioDia, 'id'>[]) =>
    api.put<ItinerarioDia[]>(`/destinos/${id}/itinerario/`, dias).then((r) => r.data),

  // ── Aeropuertos ─────────────────────────────────────────────────────────
  listarAeropuertos: (params: { q?: string; destino_id?: number } = {}) =>
    api.get<Paginado<Aeropuerto>>('/aeropuertos/', { params }).then((r) => r.data),

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

  // ── CU4: Vuelos ──────────────────────────────────────────────────────────
  listarVuelos: (filtros: FiltrosVuelo = {}) =>
    api.get<Paginado<Vuelo>>('/vuelos/', { params: filtros }).then((r) => r.data),

  obtenerVuelo: (id: number) =>
    api.get<Vuelo>(`/vuelos/${id}/`).then((r) => r.data),

  crearVuelo: (data: CrearVueloPayload) =>
    api.post<Vuelo>('/vuelos/', data).then((r) => r.data),

  actualizarVuelo: (id: number, data: Partial<CrearVueloPayload>) =>
    api.patch<Vuelo>(`/vuelos/${id}/`, data).then((r) => r.data),

  eliminarVuelo: (id: number) =>
    api.delete(`/vuelos/${id}/`).then((r) => r.data),

  // ── CU5: Hoteles y Habitaciones ──────────────────────────────────────────
  listarHoteles: (filtros: FiltrosHotel = {}) =>
    api.get<Paginado<Hotel>>('/hoteles/', { params: filtros }).then((r) => r.data),

  obtenerHotel: (id: number) =>
    api.get<Hotel>(`/hoteles/${id}/`).then((r) => r.data),

  crearHotel: (data: CrearHotelPayload) =>
    api.post<Hotel>('/hoteles/', data).then((r) => r.data),

  actualizarHotel: (id: number, data: Partial<CrearHotelPayload>) =>
    api.patch<Hotel>(`/hoteles/${id}/`, data).then((r) => r.data),

  eliminarHotel: (id: number) =>
    api.delete(`/hoteles/${id}/`).then((r) => r.data),

  listarHabitaciones: (hotel_id?: number) =>
    api.get<Paginado<Habitacion>>('/habitaciones/', { params: { hotel_id } }).then((r) => r.data),

  crearHabitacion: (data: CrearHabitacionPayload) =>
    api.post<Habitacion>('/habitaciones/', data).then((r) => r.data),

  actualizarHabitacion: (id: number, data: Partial<CrearHabitacionPayload>) =>
    api.patch<Habitacion>(`/habitaciones/${id}/`, data).then((r) => r.data),

  eliminarHabitacion: (id: number) =>
    api.delete(`/habitaciones/${id}/`).then((r) => r.data),

  // ── CU6: Paquetes y Salidas ──────────────────────────────────────────────
  listarPaquetes: (filtros: FiltrosPaquete = {}) =>
    api.get<Paginado<Paquete>>('/paquetes/', { params: filtros }).then((r) => r.data),

  obtenerPaquete: (id: number) =>
    api.get<Paquete>(`/paquetes/${id}/`).then((r) => r.data),

  crearPaquete: (data: CrearPaquetePayload) =>
    api.post<Paquete>('/paquetes/', data).then((r) => r.data),

  actualizarPaquete: (id: number, data: Partial<CrearPaquetePayload>) =>
    api.patch<Paquete>(`/paquetes/${id}/`, data).then((r) => r.data),

  eliminarPaquete: (id: number) =>
    api.delete(`/paquetes/${id}/`).then((r) => r.data),

  listarSalidas: (filtros: FiltrosSalida = {}) =>
    api.get<Paginado<PaqueteSalida>>('/salidas/', { params: filtros }).then((r) => r.data),

  crearSalida: (data: CrearSalidaPayload) =>
    api.post<PaqueteSalida>('/salidas/', data).then((r) => r.data),

  actualizarSalida: (id: number, data: Partial<CrearSalidaPayload>) =>
    api.patch<PaqueteSalida>(`/salidas/${id}/`, data).then((r) => r.data),

  eliminarSalida: (id: number) =>
    api.delete(`/salidas/${id}/`).then((r) => r.data),
}
