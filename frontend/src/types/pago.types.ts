/** Tipos del dominio de pagos y boleta de viaje (CU9). */
import type { Reserva } from '@/types/reserva.types'

export type MetodoVentanilla = 'efectivo' | 'tarjeta' | 'qr' | 'transferencia'
export type MetodoCliente = 'tarjeta' | 'qr'

export type EstadoPago = 'pendiente' | 'aprobado' | 'fallido' | 'reembolsado'

export interface Pago {
  id: number
  reserva: number
  monto: string
  moneda: string
  tipo_cambio_a_bob: string
  monto_bob: string
  metodo: string
  estado: EstadoPago
  creado_en: string
}

export interface VentaResultado {
  reserva: Reserva
  pago: Pago
  boleta_url: string
}

export interface ClienteNuevoPayload {
  nombres: string
  apellidos: string
  documento_tipo?: string | null
  documento_numero?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
}

export interface PasajeroVentaPayload {
  nombres: string
  apellidos: string
  documento_tipo?: string | null
  documento_numero?: string | null
  fecha_nacimiento?: string | null
}

export interface VentaVentanillaPayload {
  cliente_id?: number
  cliente_nuevo?: ClienteNuevoPayload
  salida_id: number
  num_personas: number
  metodo: MetodoVentanilla
  pasajeros: PasajeroVentaPayload[]
}

export interface PagoClientePayload {
  reserva_id: number
  metodo: MetodoCliente
}
