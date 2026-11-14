import { api } from '@/lib/axios'
import type {
  OcupacionParams,
  ReporteOcupacion,
  ReporteParams,
  ReporteVentas,
} from '@/types/reportes.types'

export const reportesApi = {

  ventas: (params: ReporteParams = {}) =>
    api.get<ReporteVentas>('/reportes/ventas/', { params }).then((r) => r.data),

  ocupacion: (params: OcupacionParams = {}) =>
    api
      .get<ReporteOcupacion>('/reportes/ocupacion/', { params })
      .then((r) => r.data),

  descargarVentasCsv: (params: ReporteParams = {}) =>
    api
      .get<Blob>('/reportes/ventas/', {
        params: { ...params, formato: 'csv' },
        responseType: 'blob',
      })
      .then((r) => r.data),
}
