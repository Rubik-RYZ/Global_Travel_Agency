/** Tipos del dominio de IA (CU10/CU11). */
export interface MensajeChat {
  id: string
  emisor: 'usuario' | 'agente'
  texto: string
  creado_en: string
}

export interface ConversacionChat {
  id: string
  mensajes: MensajeChat[]
  creada_en: string
  actualizada_en: string
}

export interface Recomendacion {
  paquete_id: number
  puntaje: number
}
