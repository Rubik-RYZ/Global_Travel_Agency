/** Tipos del dominio de reservas e itinerarios (CU7 · CU8). */
import type { PaqueteSalida } from '@/types/catalogo.types'

export type EstadoReserva = 'pendiente' | 'confirmada' | 'pagada' | 'cancelada'
export type CanalReserva = 'web' | 'agente' | 'personal'
export type DocumentoTipo = 'CI' | 'PASAPORTE' | 'OTRO'

export interface Pasajero {
  id?: number
  nombres: string
  apellidos: string
  documento_tipo?: DocumentoTipo | null
  documento_numero?: string | null
  fecha_nacimiento?: string | null
}

export interface Reserva {
  id: number
  codigo: string
  cliente: number
  cliente_nombre?: string
  cliente_documento?: string
  cliente_telefono?: string
  salida: number | PaqueteSalida
  paquete_nombre?: string
  destino_nombre?: string
  fecha_salida?: string
  num_personas: number
  estado: EstadoReserva
  total: string | number
  moneda: string
  canal: CanalReserva
  conversacion_id?: string | null
  creada_en: string
  actualizada_en?: string
  pasajeros?: Pasajero[]
}

export interface CrearReservaPayload {
  cliente_id?: number
  salida_id: number
  num_personas: number
  canal?: CanalReserva
  conversacion_id?: string | null
  pasajeros: {
    nombres: string
    apellidos: string
    documento_tipo?: DocumentoTipo | null
    documento_numero?: string | null
    fecha_nacimiento?: string | null
  }[]
}

/* -------------------------------------------------------------------------- */
/* CU8: Itinerarios y Notificaciones                                          */
/* -------------------------------------------------------------------------- */
export interface ItinerarioItem {
  id?: number
  dia: number
  orden: number
  hora?: string | null
  titulo: string
  descripcion?: string | null
  latitud?: string | null
  longitud?: string | null
}

export interface Itinerario {
  id: number
  reserva: number
  reserva_codigo?: string
  generado_por: 'sistema' | 'ia' | 'personal'
  pdf_url?: string | null
  creado_en: string
  items: ItinerarioItem[]
}

export interface Notificacion {
  id: number
  tipo: 'confirmacion_reserva' | 'comprobante_pago' | 'itinerario'
  estado: 'pendiente' | 'enviada' | 'fallida'
  reserva?: number | null
  reserva_codigo?: string | null
  creado_en: string
}
