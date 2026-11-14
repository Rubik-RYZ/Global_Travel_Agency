export interface ClientePreferencia {
  presupuesto_max: string | null
  moneda: string
  intereses: string[]
  actualizado_en: string
}

export interface Cliente {
  id: number
  usuario: number | null
  usuario_email: string | null
  foto_url: string | null
  nombres: string
  apellidos: string
  nombre_completo: string
  documento_tipo: string | null
  documento_numero: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  pais_origen: string | null
  pasaporte_url: string | null
  pasaporte_public_id: string | null
  carnet_url: string | null
  carnet_public_id: string | null
  preferencias: ClientePreferencia | null
  creado_en: string
}

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
  pasaporte_url: string | null
  pasaporte_public_id: string | null
  carnet_url: string | null
  carnet_public_id: string | null
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
  pasaporte_url?: string | null
  pasaporte_public_id?: string | null
  carnet_url?: string | null
  carnet_public_id?: string | null
}

export type PerfilPayload = ClientePayload

export interface PreferenciasPayload {
  presupuesto_max?: string | null
  moneda?: string
  intereses?: string[]
}
