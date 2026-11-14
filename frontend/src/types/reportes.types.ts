export type Agrupacion = 'dia' | 'semana' | 'mes'
export type Canal = 'web' | 'agente' | 'personal'

export interface ReporteParams {
  desde?: string
  hasta?: string
  agrupacion?: Agrupacion
  canal?: Canal | ''
}

export interface ReporteRango {
  desde: string
  hasta: string
  agrupacion?: Agrupacion
  canal?: Canal | null
}

export interface ResumenVentas {
  reservas: number
  reservas_pagadas: number
  reservas_canceladas: number
  pasajeros: number
  ingresos_bob: number
  ticket_promedio_bob: number
}

export interface PuntoSerie {
  periodo: string
  etiqueta: string
  reservas: number
  pasajeros: number
  ingresos_bob: number
}

export interface FilaCanal {
  canal: string
  etiqueta: string
  reservas: number
  pasajeros: number
  ingresos_bob: number
}

export interface FilaPaquete {
  paquete_id: number | null
  paquete: string
  destino: string
  reservas: number
  pasajeros: number
  ingresos_bob: number
}

export interface FilaDestino {
  destino: string
  pais: string
  reservas: number
  pasajeros: number
  ingresos_bob: number
}

export interface FilaMetodo {
  metodo: string
  pagos: number
  ingresos_bob: number
}

export interface FilaEmpleado {
  usuario_id: number | null
  email: string
  reservas: number
  pasajeros: number
  ingresos_bob: number
}

export interface ReporteVentas {
  rango: ReporteRango
  resumen: ResumenVentas
  serie: PuntoSerie[]
  por_canal: FilaCanal[]
  por_paquete: FilaPaquete[]
  por_destino: FilaDestino[]
  por_metodo: FilaMetodo[]
  por_empleado: FilaEmpleado[]
}

export interface SalidaOcupacion {
  id: number
  paquete_id: number
  paquete: string
  destino: string
  fecha_salida: string
  cupos_totales: number
  cupos_disponibles: number
  vendidos: number
  ocupacion_pct: number
}

export interface TotalesOcupacion {
  salidas: number
  cupos_totales: number
  vendidos: number
  disponibles: number
  ocupacion_pct: number
}

export interface ReporteOcupacion {
  rango: { desde: string; hasta: string }
  totales: TotalesOcupacion
  salidas: SalidaOcupacion[]
}

export interface OcupacionParams {
  desde?: string
  hasta?: string
  paquete_id?: number
}
