export type EstadoReserva = 'pendiente' | 'confirmada' | 'pagada' | 'cancelada'

export interface Reserva {
  id: number
  codigo: string
  estado: EstadoReserva
  num_personas: number
  total: string
  moneda: string
}
