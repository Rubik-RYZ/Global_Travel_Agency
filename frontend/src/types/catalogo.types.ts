/** Tipos del catálogo turístico (CU3, CU4, CU5, CU6). */
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
  pais?: string | null
  ciudad?: string | null
  contacto?: string | null
  email: string | null
  telefono: string | null
  notas?: string | null
  logo_url?: string | null
  activo: boolean
}

/* -------------------------------------------------------------------------- */
/* CU4: Vuelos                                                                */
/* -------------------------------------------------------------------------- */
export interface Vuelo {
  id: number
  proveedor: number
  proveedor_nombre?: string
  numero_vuelo: string
  origen: string
  origen_codigo?: string
  origen_nombre?: string
  destino: string
  destino_codigo?: string
  destino_nombre?: string
  salida: string
  llegada: string
  precio: string | number
  moneda: 'BOB' | 'USD' | 'EUR'
  cupos_totales: number
  cupos_disponibles: number
  referencia_externa?: string | null
}

export interface CrearVueloPayload {
  proveedor_id: number
  numero_vuelo: string
  origen_codigo: string
  destino_codigo: string
  salida: string
  llegada: string
  precio: number | string
  moneda?: 'BOB' | 'USD' | 'EUR'
  cupos_totales: number
  cupos_disponibles?: number
  referencia_externa?: string
}

/* -------------------------------------------------------------------------- */
/* CU5: Hoteles y Habitaciones                                                */
/* -------------------------------------------------------------------------- */
export interface Habitacion {
  id: number
  hotel: number
  tipo: string
  capacidad: number
  precio_noche: string | number
  moneda: 'BOB' | 'USD' | 'EUR'
}

export interface Hotel {
  id: number
  proveedor: number
  proveedor_nombre?: string
  destino: number
  destino_nombre?: string
  nombre: string
  estrellas: number | null
  direccion: string | null
  latitud: string | null
  longitud: string | null
  descripcion: string | null
  activo: boolean
  habitaciones?: Habitacion[]
}

export interface CrearHotelPayload {
  proveedor_id: number
  destino_id: number
  nombre: string
  estrellas?: number | null
  direccion?: string
  latitud?: number | null
  longitud?: number | null
  descripcion?: string
  activo?: boolean
}

export interface CrearHabitacionPayload {
  hotel_id: number
  tipo: string
  capacidad: number
  precio_noche: number | string
  moneda?: 'BOB' | 'USD' | 'EUR'
}

/* -------------------------------------------------------------------------- */
/* CU6: Paquetes y Salidas Programadas                                        */
/* -------------------------------------------------------------------------- */
export interface PaqueteSalida {
  id: number
  paquete: number
  paquete_nombre?: string
  fecha_salida: string
  vuelo_ida?: number | null
  vuelo_ida_detalle?: Vuelo | null
  vuelo_vuelta?: number | null
  vuelo_vuelta_detalle?: Vuelo | null
  cupos_totales: number
  cupos_disponibles: number
}

export interface Paquete {
  id: number
  destino: number
  destino_nombre?: string
  destino_pais?: string
  destino_imagen_principal?: string | null
  hotel?: number | null
  hotel_nombre?: string | null
  hotel_estrellas?: number | null
  nombre: string
  descripcion: string | null
  duracion_dias: number
  precio_base: string | number
  moneda: 'BOB' | 'USD' | 'EUR'
  etiquetas: string[]
  activo: boolean
  salidas?: PaqueteSalida[]
}

export interface CrearPaquetePayload {
  destino_id: number
  hotel_id?: number | null
  nombre: string
  descripcion?: string
  duracion_dias: number
  precio_base: number | string
  moneda?: 'BOB' | 'USD' | 'EUR'
  etiquetas?: string[]
  activo?: boolean
}

export interface CrearSalidaPayload {
  paquete_id: number
  fecha_salida: string
  vuelo_ida_id?: number | null
  vuelo_vuelta_id?: number | null
  cupos_totales: number
  cupos_disponibles?: number
}
