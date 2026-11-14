export interface MensajeChat {
  id: number
  emisor: 'usuario' | 'agente'
  texto: string
  creado_en: string
}

export interface Recomendacion {
  paquete_id: number
  puntaje: number
}
