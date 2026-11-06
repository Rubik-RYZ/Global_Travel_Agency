/** Tipos del dominio de IA (CU10/CU11) — se amplían en el Sprint 5. */
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
