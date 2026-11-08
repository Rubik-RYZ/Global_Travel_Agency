/** Tipos del dominio de IA (CU10/CU11). */

/* -------------------------------------------------------------------------- */
/* CU10 · Chat e historial                                                    */
/* -------------------------------------------------------------------------- */
export interface MensajeChat {
  id: string
  emisor: 'usuario' | 'agente'
  texto: string
  creado_en: string
  intencion_nombre?: string | null
  confianza?: string | null
}

export interface ConversacionChat {
  id: string
  /** Identificador de la conversación en la base de datos, si ya existe. */
  servidorId?: string
  /** Historial que proviene del backend (se puede continuar). */
  persistida?: boolean
  titulo?: string
  mensajes: MensajeChat[]
  creada_en: string
  actualizada_en: string
  intencion_activa?: string | null
}

export interface RespuestaChat {
  respuesta: string
  intencion: string
  confianza: number
  permitida: boolean
  conversacion_id: string | null
}

/* -------------------------------------------------------------------------- */
/* CU10 · Entrenamiento                                                       */
/* -------------------------------------------------------------------------- */
export interface IntencionIA {
  id: number
  nombre: string
  descripcion: string | null
  activa: boolean
  total_frases: number
}

export interface FraseIA {
  id: number
  intencion: number
  intencion_nombre: string
  texto: string
  origen: 'manual' | 'historial'
  creado_en: string
}

export interface ModeloIA {
  id: number
  nombre: string
  version: string
  tipo: 'clasificador_intenciones' | 'recomendador'
  metricas: Record<string, unknown> | null
  activo: boolean
  entrenado_en: string
}

export interface PanelEntrenamiento {
  intenciones: IntencionIA[]
  frases_total: number
  conversaciones_total: number
  mensajes_total: number
  modelo_activo: ModeloIA | null
  modelos: ModeloIA[]
}

/* -------------------------------------------------------------------------- */
/* CU11 · Recomendaciones                                                     */
/* -------------------------------------------------------------------------- */
export interface PaqueteRecomendado {
  id: number
  nombre: string
  descripcion: string | null
  duracion_dias: number
  precio_base: string
  moneda: string
  etiquetas: string[]
  destino_nombre: string
  destino_pais: string
  destino_imagen: string | null
  destino_caracter: string | null
}

export interface Recomendacion {
  id: number
  puntaje: string
  puntaje_porcentaje: number
  mostrada: boolean
  aceptada: boolean | null
  generada_en: string
  paquete: PaqueteRecomendado
}

export interface RespuestaRecomendaciones {
  modelo: ModeloIA | null
  preferencias: {
    presupuesto_max: string | null
    moneda: string
    intereses: string[]
    actualizado_en: string
  } | null
  recomendaciones: Recomendacion[]
  generada_en: string | null
}

export interface ResumenRecomendaciones {
  total: number
  mostradas: number
  aceptadas: number
  tasa_aceptacion: number
}

export interface RecomendacionAdmin {
  id: number
  cliente: string
  paquete: string
  destino: string
  modelo_version: string | null
  puntaje: string
  mostrada: boolean
  aceptada: boolean | null
  generada_en: string
}

export interface PanelRecomendaciones {
  resumen: ResumenRecomendaciones
  por_paquete: {
    paquete_id: number
    paquete__nombre: string
    paquete__destino__nombre: string
    total: number
    aceptadas: number
    mostradas: number
  }[]
  por_modelo: {
    modelo__nombre: string
    modelo__version: string
    total: number
    aceptadas: number
  }[]
  recientes: RecomendacionAdmin[]
}
