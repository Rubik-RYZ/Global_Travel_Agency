import { useEffect, useState } from 'react'

import { perfilApi } from '@/api/clientes'
import { Button } from '@/components/ui/Button/Button'
import { IconoDocumento, IconoPersona, IconoSello, IconoSubir } from '@/components/ui/Iconos'
import { SubidorImagen } from '@/components/ui/SubidorImagen/SubidorImagen'
import { useAuthStore } from '@/store/authStore'
import type { PerfilViajero } from '@/types/clientes.types'
import { mensajeDeError } from '@/utils/validators'

interface Props {
  perfil: PerfilViajero
  onGuardado: () => void
}

/** Documento digitalizado (URL + identificador en el almacén). */
interface Documento {
  url: string
  publicId: string
}

const DOC_VACIO: Documento = { url: '', publicId: '' }

/**
 * Cuerpo del capítulo «Credenciales de viaje» del Resumen de «Mi viaje»:
 * el propio viajero sube su retrato y digitaliza su pasaporte y su carnet.
 *
 * Las láminas se alojan en el almacén del proyecto (vía `/almacen/subir/`);
 * si el entorno no tiene credenciales la subida aparece deshabilitada y el
 * resto de la ficha sigue funcionando con normalidad.
 */
export function DocumentosViajeroForm({ perfil, onGuardado }: Props) {
  const usuario = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)

  const [foto, setFoto] = useState<Documento>(DOC_VACIO)
  const [pasaporte, setPasaporte] = useState<Documento>(DOC_VACIO)
  const [carnet, setCarnet] = useState<Documento>(DOC_VACIO)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setFoto({ url: usuario?.foto_url ?? '', publicId: usuario?.foto_public_id ?? '' })
    setPasaporte({
      url: perfil.pasaporte_url ?? '',
      publicId: perfil.pasaporte_public_id ?? '',
    })
    setCarnet({
      url: perfil.carnet_url ?? '',
      publicId: perfil.carnet_public_id ?? '',
    })
    setOk(false)
  }, [perfil, usuario?.foto_url, usuario?.foto_public_id])

  const faltantes = [pasaporte, carnet].filter((d) => d.url).length

  async function guardar() {
    setError(null)
    setOk(false)
    setGuardando(true)
    try {
      const [actualizado, conRetrato] = await Promise.all([
        perfilApi.actualizarParcial({
          pasaporte_url: pasaporte.url || null,
          pasaporte_public_id: pasaporte.publicId || null,
          carnet_url: carnet.url || null,
          carnet_public_id: carnet.publicId || null,
        }),
        perfilApi.guardarFoto({
          foto_url: foto.url || null,
          foto_public_id: foto.publicId || null,
        }),
      ])
      // El avatar del menú superior se refresca al instante.
      if (usuario) setUsuario(conRetrato)
      onGuardado()
      setOk(true)
      void actualizado
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Retrato del viajero */}
        <div className="lg:col-span-5">
          <div className="flex h-full flex-col gap-3 rounded-md border border-parchment-border bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <IconoPersona className="h-4 w-4 text-terracotta" />
              <span className="coord text-secondary">Retrato del expedicionario</span>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-on-surface-variant">
              Aparece en su credencial y junto a sus reservas. Una foto de frente,
              con buena luz, evita demoras en el embarque.
            </p>
            <SubidorImagen
              valor={foto.url}
              publicId={foto.publicId || null}
              onChange={(url, publicId) => {
                setOk(false)
                setFoto({ url, publicId: publicId ?? '' })
              }}
              carpeta="perfiles"
              etiqueta="Fotografía de perfil"
              ayuda="JPG, PNG, WEBP o AVIF · rostro despejado."
            />
          </div>
        </div>

        {/* Documentos digitalizados */}
        <div className="lg:col-span-7">
          <div className="flex h-full flex-col gap-4 rounded-md border border-parchment-border bg-surface-container-low p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconoDocumento className="h-4 w-4 text-terracotta" />
                <span className="coord text-secondary">Documentos de viaje</span>
              </div>
              <span className="coord text-stamp-sepia">{faltantes}/2 digitalizados</span>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-on-surface-variant">
              Se alojan en el archivo privado de la casa y quedan enlazados a su
              ficha. Sirven para emitir boletos y confirmar reservas sin pedirle
              los papeles otra vez.
            </p>
            <SubidorImagen
              valor={pasaporte.url}
              publicId={pasaporte.publicId || null}
              onChange={(url, publicId) => {
                setOk(false)
                setPasaporte({ url, publicId: publicId ?? '' })
              }}
              carpeta="pasaportes"
              forma="documento"
              etiqueta="Pasaporte vigente"
            />
            <SubidorImagen
              valor={carnet.url}
              publicId={carnet.publicId || null}
              onChange={(url, publicId) => {
                setOk(false)
                setCarnet({ url, publicId: publicId ?? '' })
              }}
              carpeta="carnets"
              forma="documento"
              etiqueta="Carnet de identidad"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-parchment-border/70 pt-5">
        <span className="flex items-center gap-2 font-hand text-lg text-stamp-sepia">
          <IconoSello className="h-4 w-4 text-terracotta" />
          {ok ? 'Credenciales selladas ✓' : 'Sus láminas quedan bajo custodia de la casa.'}
        </span>
        <Button type="button" onClick={() => void guardar()} disabled={guardando}>
          <IconoSubir className="h-4 w-4" />
          {guardando ? 'Sellando...' : 'Guardar credenciales'}
        </Button>
      </div>
    </div>
  )
}
