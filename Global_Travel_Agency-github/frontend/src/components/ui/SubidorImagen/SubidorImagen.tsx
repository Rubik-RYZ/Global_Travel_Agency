import { useEffect, useRef, useState } from 'react'

import { almacenApi, type EstadoAlmacen } from '@/api/almacen'
import { IconoCerrar, IconoSubir } from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export interface SubidorImagenProps {
  /** URL o ruta actual del recurso. */
  valor: string
  /** Identificador en el almacén del recurso actual (para retirarlo al reemplazar). */
  publicId?: string | null
  /**
   * Se dispara al subir o al pegar un enlace. Devuelve la URL y el `public_id`
   * (`null` si se escribió a mano).
   */
  onChange: (url: string, publicId: string | null) => void
  /** Carpeta del almacén: `destinos`, `proveedores`, `pasaportes`, `carnets`, `equipo`. */
  carpeta: string
  etiqueta?: string
  ayuda?: string
  /** Proporción de la vista previa. */
  forma?: 'lamina' | 'documento'
  /** Bloquea la edición (p. ej. agente sin permiso de publicación). */
  deshabilitado?: boolean
}

/**
 * Selector de archivo con vista previa que sube al almacén externo.
 *
 * Si el entorno no tiene credenciales la subida aparece deshabilitada con un
 * mensaje explícito —el sistema sigue funcionando y las imágenes ya guardadas
 * se ven igual—, pero siempre queda la opción de pegar una ruta o URL a mano.
 */
export function SubidorImagen({
  valor,
  publicId,
  onChange,
  carpeta,
  etiqueta = 'Lámina del recurso',
  ayuda,
  forma = 'lamina',
  deshabilitado = false,
}: SubidorImagenProps) {
  const entradaRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<EstadoAlmacen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    let vigente = true
    almacenApi
      .estado()
      .then((datos) => {
        if (vigente) setEstado(datos)
      })
      .catch(() => {
        if (vigente) setEstado(null)
      })
    return () => {
      vigente = false
    }
  }, [])

  const configurado = estado?.configurado ?? false
  const limiteMb = estado?.limite_mb ?? 8

  async function subirArchivo(archivo: File) {
    setError(null)
    if (archivo.size > limiteMb * 1024 * 1024) {
      setError(`El archivo supera el límite de ${limiteMb} MB.`)
      return
    }
    setSubiendo(true)
    try {
      const subido = await almacenApi.subir(archivo, carpeta)
      // La lámina reemplazada se retira del almacén para no dejar huérfanos.
      if (publicId && publicId !== subido.public_id) {
        void almacenApi.eliminar(publicId).catch(() => undefined)
      }
      onChange(subido.url, subido.public_id)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setSubiendo(false)
      if (entradaRef.current) entradaRef.current.value = ''
    }
  }

  function quitar() {
    setError(null)
    if (publicId) {
      void almacenApi.eliminar(publicId).catch(() => undefined)
    }
    onChange('', null)
  }

  const alto = forma === 'documento' ? 'h-32' : 'h-44'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="coord">{etiqueta}</span>
        {estado && !configurado && (
          <span className="coord text-stamp-sepia">Subida no configurada</span>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-outline-variant/50 bg-surface-container-lowest p-3 sm:flex-row">
        <div
          className={`relative ${alto} w-full shrink-0 overflow-hidden rounded border border-outline-variant/40 bg-surface-dim sm:w-56`}
        >
          {valor ? (
            <img src={valor} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-sans text-[11px] text-stamp-sepia/60">
              Sin archivo
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={entradaRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                if (archivo) void subirArchivo(archivo)
              }}
            />
            <button
              type="button"
              disabled={!configurado || subiendo || deshabilitado}
              onClick={() => entradaRef.current?.click()}
              title={
                configurado
                  ? undefined
                  : 'Añada las credenciales CLOUDINARY_* al .env para habilitar la subida.'
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-surface-dim disabled:text-stamp-sepia"
            >
              <IconoSubir className="h-3.5 w-3.5" />
              {subiendo ? 'Subiendo...' : valor ? 'Reemplazar' : 'Subir archivo'}
            </button>

            {valor && (
              <button
                type="button"
                disabled={subiendo || deshabilitado}
                onClick={quitar}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-error disabled:opacity-50"
              >
                <IconoCerrar className="h-3.5 w-3.5" />
                Quitar
              </button>
            )}

            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => setManual((v) => !v)}
              className="coord text-primary transition-colors hover:text-terracotta disabled:opacity-50"
            >
              {manual ? 'Ocultar enlace' : 'Pegar enlace'}
            </button>
          </div>

          {manual ? (
            <input
              type="text"
              value={valor}
              disabled={deshabilitado}
              onChange={(e) => onChange(e.target.value, null)}
              placeholder="/assets/destino-1.jpg"
              className="w-full rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-xs text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/50 focus:border-primary"
            />
          ) : (
            <p className="truncate font-sans text-[11px] text-stamp-sepia">
              {valor || 'Aún no hay archivo asociado.'}
            </p>
          )}

          <p className="font-sans text-[11px] leading-relaxed text-on-surface-variant">
            {error ? (
              <span className="text-error">{error}</span>
            ) : (
              (ayuda ??
              `JPG, PNG, WEBP o AVIF · hasta ${limiteMb} MB. La firma vive en el servidor.`)
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
