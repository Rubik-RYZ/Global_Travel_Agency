/** Tipos del dominio de pagos y boleta de viaje (CU9). */
import type { Paginated } from '@/types/api.types'
import type { EstadoReserva, Reserva } from '@/types/reserva.types'

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

export interface PagoAdmin extends Pago {
  reserva_codigo: string
  reserva_estado: EstadoReserva
  cliente_id: number
  cliente_nombre: string
  cliente_documento: string | null
  paquete_nombre: string
  destino_nombre: string
  fecha_salida: string
}

export interface TotalesPagos {
  total_registros: number
  total_bob: string
  aprobado_bob: string
  pendiente_bob: string
  reembolsado_bob: string
}

export interface PagosAdminPagina extends Paginated<PagoAdmin> {
  totales: TotalesPagos
}

export interface FiltrosPagoAdmin {
  q?: string
  estado?: EstadoPago | ''
  metodo?: string
  moneda?: string
  reserva_id?: number
  desde?: string
  hasta?: string
  page?: number
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
