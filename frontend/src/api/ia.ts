import { api } from '@/lib/axios'

export interface RespuestaChat {
  respuesta: string
  intencion: string
  confianza: number
  permitida: boolean
}

export const iaApi = {
  chat: (mensaje: string) =>
    api.post<RespuestaChat>('/ia/chat/', { mensaje }).then((respuesta) => respuesta.data),
}
