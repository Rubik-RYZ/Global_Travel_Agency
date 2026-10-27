/** Tipos del dominio de pagos (CU9) — se amplían en el Sprint 4. */
export type EstadoPago = 'pendiente' | 'aprobado' | 'fallido' | 'reembolsado'

export interface Pago {
  id: number
  reserva_id: number
  monto: string
  moneda: string
  estado: EstadoPago
}
