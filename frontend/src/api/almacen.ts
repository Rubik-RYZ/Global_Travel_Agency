import { api } from '@/lib/axios'

export interface CarpetaAlmacen {
  clave: string
  etiqueta: string
}

export interface EstadoAlmacen {

  configurado: boolean
  limite_mb: number
  formatos: string[]
  carpetas: CarpetaAlmacen[]
}

export interface ArchivoSubido {
  url: string
  public_id: string | null
  formato: string | null
  ancho: number | null
  alto: number | null
  bytes: number | null
  carpeta: string
  carpeta_clave?: string
}

let estadoEnVuelo: Promise<EstadoAlmacen> | null = null

export function estadoAlmacen(): Promise<EstadoAlmacen> {
  if (!estadoEnVuelo) {
    estadoEnVuelo = api
      .get<EstadoAlmacen>('/almacen/estado/')
      .then((r) => r.data)
      .catch((error) => {
        estadoEnVuelo = null
        throw error
      })
  }
  return estadoEnVuelo
}

export const almacenApi = {
  estado: estadoAlmacen,

  subir: (archivo: File, carpeta: string) => {
    const cuerpo = new FormData()
    cuerpo.append('archivo', archivo)
    cuerpo.append('carpeta', carpeta)
    return api
      .post<ArchivoSubido>('/almacen/subir/', cuerpo, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  eliminar: (publicId: string) =>
    api
      .post<{ public_id: string; borrado: boolean }>('/almacen/eliminar/', {
        public_id: publicId,
      })
      .then((r) => r.data),
}
