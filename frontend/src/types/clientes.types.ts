/** Tipos del dominio de clientes y preferencias (CU2). */

export interface ClientePreferencia {
  presupuesto_max: string | null
  moneda: string
  intereses: string[]
  actualizado_en: string
}

/** Viajero tal como lo expone el panel (directorio y ficha). */
export interface Cliente {
  id: number
  usuario: number | null
  usuario_email: string | null
  nombres: string
  apellidos: string
  nombre_completo: string
  documento_tipo: string | null
  documento_numero: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  pais_origen: string | null
  preferencias: ClientePreferencia | null
  creado_en: string
}

/** Ficha que ve el propio viajero en «Mi viaje». */
export interface PerfilViajero {
  id: number
  email: string | null
  nombres: string
  apellidos: string
  nombre_completo: string
  documento_tipo: string | null
  documento_numero: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  pais_origen: string | null
  creado_en: string
}

export interface ClientePayload {
  nombres: string
  apellidos: string
  documento_tipo?: string | null
  documento_numero?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  pais_origen?: string | null
}

export type PerfilPayload = ClientePayload

export interface PreferenciasPayload {
  presupuesto_max?: string | null
  moneda?: string
  intereses?: string[]
}
