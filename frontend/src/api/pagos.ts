/** Servicios de API para pagos y boleta de viaje (CU9). */
import { api } from '@/lib/axios'
import type {
  PagoClientePayload,
  VentaResultado,
  VentaVentanillaPayload,
} from '@/types/pago.types'

export const pagosApi = {
  /** Venta presencial en ventanilla (admin o agente). */
  ventaVentanilla: (payload: VentaVentanillaPayload) =>
    api.post<VentaResultado>('/pagos/ventanilla/', payload).then((r) => r.data),

  /** Pago en línea del viajero autenticado (tarjeta o QR, simulado). */
  pagarCliente: (payload: PagoClientePayload) =>
    api.post<VentaResultado>('/pagos/cliente/', payload).then((r) => r.data),

  /** Devuelve el PDF de la boleta como Blob para descargarlo. */
  descargarBoleta: (reservaId: number) =>
    api
      .get<Blob>(`/pagos/boleta/${reservaId}/`, { responseType: 'blob' })
      .then((r) => r.data),
}

/** Dispara la descarga de un Blob en el navegador. */
export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
