/** Cliente HTTP del asistente conversacional y recomendador (CU10/CU11). */
import { api } from '@/lib/axios'
import type {
  ConversacionChat,
  FraseIA,
  IntencionIA,
  PanelEntrenamiento,
  PanelRecomendaciones,
  Recomendacion,
  RespuestaChat,
  RespuestaRecomendaciones,
} from '@/types/ia.types'

interface MensajeServidor {
  id: number
  emisor: 'usuario' | 'agente'
  texto: string
  intencion_nombre: string | null
  confianza: string | null
  creado_en: string
}

interface ConversacionServidor {
  id: string
  titulo: string
  intencion_activa: string | null
  estado_dialogo: Record<string, unknown>
  cerrada: boolean
  iniciada_en: string
  ultima_actividad: string
  mensajes: MensajeServidor[]
}

function mapearConversacion(conversacion: ConversacionServidor): ConversacionChat {
  return {
    id: conversacion.id,
    servidorId: conversacion.id,
    persistida: true,
    titulo: conversacion.titulo,
    creada_en: conversacion.iniciada_en,
    actualizada_en: conversacion.ultima_actividad,
    intencion_activa: conversacion.intencion_activa,
    mensajes: conversacion.mensajes.map((mensaje) => ({
      id: String(mensaje.id),
      emisor: mensaje.emisor,
      texto: mensaje.texto,
      creado_en: mensaje.creado_en,
      intencion_nombre: mensaje.intencion_nombre,
      confianza: mensaje.confianza,
    })),
  }
}

export interface FrasePayload {
  intencion: number
  texto: string
  origen?: 'manual' | 'historial'
}

export interface IntencionPayload {
  nombre: string
  descripcion?: string | null
  activa?: boolean
}

export const iaApi = {
  /* CU10 · chat e historial */
  chat: (mensaje: string, conversacionId?: string | null) =>
    api
      .post<RespuestaChat>('/ia/chat/', {
        mensaje,
        conversacion_id: conversacionId ?? null,
      })
      .then((respuesta) => respuesta.data),

  historial: () =>
    api
      .get<ConversacionServidor[]>('/ia/conversaciones/')
      .then((respuesta) => respuesta.data.map(mapearConversacion)),

  /* CU10 · panel de entrenamiento */
  panelEntrenamiento: () =>
    api.get<PanelEntrenamiento>('/ia/admin/panel/').then((respuesta) => respuesta.data),

  reentrenar: () =>
    api.post<PanelEntrenamiento>('/ia/admin/reentrenar/').then((respuesta) => respuesta.data),

  intenciones: {
    listar: () =>
      api.get<IntencionIA[]>('/ia/admin/intenciones/').then((respuesta) => respuesta.data),
    crear: (payload: IntencionPayload) =>
      api.post<IntencionIA>('/ia/admin/intenciones/', payload).then((r) => r.data),
    actualizar: (id: number, payload: Partial<IntencionPayload>) =>
      api.patch<IntencionIA>(`/ia/admin/intenciones/${id}/`, payload).then((r) => r.data),
    eliminar: (id: number) => api.delete(`/ia/admin/intenciones/${id}/`).then((r) => r.data),
  },

  frases: {
    listar: (params?: { intencion?: number; q?: string }) =>
      api
        .get<FraseIA[]>('/ia/admin/frases/', { params })
        .then((respuesta) => respuesta.data),
    crear: (payload: FrasePayload) =>
      api.post<FraseIA>('/ia/admin/frases/', payload).then((r) => r.data),
    actualizar: (id: number, payload: Partial<FrasePayload>) =>
      api.patch<FraseIA>(`/ia/admin/frases/${id}/`, payload).then((r) => r.data),
    eliminar: (id: number) => api.delete(`/ia/admin/frases/${id}/`).then((r) => r.data),
  },

  /* CU11 · recomendaciones */
  recomendaciones: (forzar = false) =>
    api
      .get<RespuestaRecomendaciones>('/ia/recomendaciones/', {
        params: forzar ? { forzar: 'true' } : undefined,
      })
      .then((respuesta) => respuesta.data),

  aceptarRecomendacion: (id: number) =>
    api
      .post<Recomendacion>(`/ia/recomendaciones/${id}/aceptar/`)
      .then((respuesta) => respuesta.data),

  panelRecomendaciones: () =>
    api
      .get<PanelRecomendaciones>('/ia/admin/recomendaciones/')
      .then((respuesta) => respuesta.data),

  entrenarRecomendador: () =>
    api
      .post<PanelRecomendaciones>('/ia/admin/recomendador/entrenar/')
      .then((respuesta) => respuesta.data),

  activarModeloRecomendador: (id: number) =>
    api
      .post<PanelRecomendaciones>(`/ia/admin/recomendador/modelos/${id}/activar/`)
      .then((respuesta) => respuesta.data),
}
