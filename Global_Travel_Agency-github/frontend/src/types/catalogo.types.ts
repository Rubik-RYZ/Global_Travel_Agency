/** Tipos del catálogo turístico (CU3). */
export interface Destino {
  id: number
  nombre: string
  pais: string
  descripcion: string | null
  latitud: string | null
  longitud: string | null
  etiquetas: string[]
  activo: boolean
}

export interface Aeropuerto {
  codigo_iata: string
  nombre: string
  destino: number
}

export type TipoProveedor = 'aerolinea' | 'hotel' | 'transporte' | 'operador' | 'otro'

export interface Proveedor {
  id: number
  nombre: string
  tipo: TipoProveedor
  email: string | null
  telefono: string | null
  activo: boolean
}
