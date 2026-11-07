/** Servicios de API para los reportes gerenciales (CU12). */
import { api } from '@/lib/axios'
import type {
  OcupacionParams,
  ReporteOcupacion,
  ReporteParams,
  ReporteVentas,
} from '@/types/reportes.types'

export const reportesApi = {
  /** Ventas, ingresos y desgloses del periodo. */
  ventas: (params: ReporteParams = {}) =>
    api.get<ReporteVentas>('/reportes/ventas/', { params }).then((r) => r.data),

  /** Ocupacion de las salidas programadas (por defecto, proximos 90 dias). */
  ocupacion: (params: OcupacionParams = {}) =>
    api
      .get<ReporteOcupacion>('/reportes/ocupacion/', { params })
      .then((r) => r.data),

  /** Descarga el reporte de ventas en CSV. */
  descargarVentasCsv: (params: ReporteParams = {}) =>
    api
      .get<Blob>('/reportes/ventas/', {
        params: { ...params, formato: 'csv' },
        responseType: 'blob',
      })
      .then((r) => r.data),
}
