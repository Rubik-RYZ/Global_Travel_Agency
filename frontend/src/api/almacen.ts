/**
 * API del almacén externo de archivos (Cloudinary — Fase 3b).
 */
import { api } from '@/lib/axios'

export interface CarpetaAlmacen {
  clave: string
  etiqueta: string
}

export interface EstadoAlmacen {
  /** Si es `false`, la subida está deshabilitada pero el sistema opera igual. */
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

/**
 * Estado del almacén cacheado: la respuesta es la misma para toda la sesión y
 * el panel lo consulta desde varias tarjetas a la vez.
 */
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

  /** Sube un archivo a la carpeta indicada y devuelve su URL y `public_id`. */
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

  /** Retira del almacén un archivo del proyecto (p. ej. la lámina reemplazada). */
  eliminar: (publicId: string) =>
    api
      .post<{ public_id: string; borrado: boolean }>('/almacen/eliminar/', {
        public_id: publicId,
      })
      .then((r) => r.data),
}
