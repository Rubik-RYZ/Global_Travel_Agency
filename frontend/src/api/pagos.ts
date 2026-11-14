import { api } from '@/lib/axios'
import type {
  FiltrosPagoAdmin,
  PagoClientePayload,
  PagosAdminPagina,
  VentaResultado,
  VentaVentanillaPayload,
} from '@/types/pago.types'

export const pagosApi = {

  listarPagos: (filtros: FiltrosPagoAdmin = {}) =>
    api.get<PagosAdminPagina>('/pagos/', { params: filtros }).then((r) => r.data),

  ventaVentanilla: (payload: VentaVentanillaPayload) =>
    api.post<VentaResultado>('/pagos/ventanilla/', payload).then((r) => r.data),

  pagarCliente: (payload: PagoClientePayload) =>
    api.post<VentaResultado>('/pagos/cliente/', payload).then((r) => r.data),

  descargarBoleta: (reservaId: number) =>
    api
      .get<Blob>(`/pagos/boleta/${reservaId}/`, { responseType: 'blob' })
      .then((r) => r.data),
}

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
