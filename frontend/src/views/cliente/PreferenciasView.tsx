import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { perfilApi } from '@/api/clientes'
import { Monograma } from '@/components/shared/Monograma'
import { IconoCorazon, IconoPasaporte, IconoSello } from '@/components/ui/Iconos'
import type { ClientePreferencia, PerfilViajero } from '@/types/clientes.types'
import { formatearFecha } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'
import { PerfilViajeroForm } from '@/views/cliente/components/PerfilViajeroForm'
import { PreferenciasForm } from '@/views/cliente/components/PreferenciasForm'

/* -------------------------------------------------------------------------- */
/* Piezas de página                                                           */
/* -------------------------------------------------------------------------- */

function ErrorNota({ texto }: { texto: string }) {
  return (
    <p className="mt-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
      {texto}
    </p>
  )
}

interface CapituloProps {
  numero: string
  kicker: string
  titulo: string
  nota: string
  icono: ReactNode
  children: ReactNode
}

/** Un capítulo del cuaderno: numeral romano, filete editorial y tarjeta. */
function Capitulo({ numero, kicker, titulo, nota, icono, children }: CapituloProps) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-terracotta/30 bg-terracotta/10 font-display text-base italic leading-none text-primary">
          {numero}
        </span>
        <span className="coord">{kicker}</span>
        <span aria-hidden className="h-px flex-1 bg-parchment-border" />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
        <header className="flex items-start gap-3 border-b border-parchment-border/70 bg-surface-container-low px-6 py-5 sm:px-8">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-primary">
            {icono}
          </span>
          <div>
            <h2 className="font-display text-2xl leading-tight text-on-surface">{titulo}</h2>
            <p className="mt-1 font-sans text-sm italic text-on-surface-variant">{nota}</p>
          </div>
        </header>
        <div className="px-6 py-6 sm:px-8">{children}</div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 11. Mi viaje · Cuaderno de preferencias                                    */
/* -------------------------------------------------------------------------- */

/** 11. Mi viaje · Perfil y preferencias → /mi-cuenta/preferencias */
export function PreferenciasView() {
  const [perfil, setPerfil] = useState<PerfilViajero | null>(null)
  const [preferencias, setPreferencias] = useState<ClientePreferencia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [p, pref] = await Promise.all([perfilApi.obtener(), perfilApi.preferencias()])
      setPerfil(p)
      setPreferencias(pref)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const recargarPerfil = async () => {
    setPerfil(await perfilApi.obtener())
  }
  const recargarPreferencias = async () => {
    setPreferencias(await perfilApi.preferencias())
  }

  if (cargando || !perfil || !preferencias) {
    return (
      <div className="mx-auto max-w-4xl">
        {error ? (
          <ErrorNota texto={error} />
        ) : (
          <p className="nota-manuscrita text-stamp-sepia">Reuniendo su cuaderno de viaje...</p>
        )}
      </div>
    )
  }

  const expediente = String(perfil.id).padStart(5, '0')

  return (
    <div className="mx-auto max-w-4xl">
      {/* --- Portada del cuaderno --- */}
      <header className="relative overflow-hidden rounded-lg border border-parchment-border bg-surface-container-low shadow-paper">
        <div aria-hidden className="papel-grano pointer-events-none absolute inset-0" />
        <div aria-hidden className="textura-carta pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monograma nombre={perfil.nombre_completo} tamano="md" />
              <div>
                <p className="coord">Cuaderno de preferencias</p>
                <p className="font-display text-lg leading-tight text-on-surface">
                  {perfil.nombre_completo}
                </p>
              </div>
            </div>
            <span className="coord inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-tertiary">
              <IconoSello className="h-3.5 w-3.5" />
              Expediente N.o {expediente}
            </span>
          </div>

          <h1 className="mt-6 font-display text-3xl leading-tight text-on-surface sm:text-4xl">
            Su cuaderno de preferencias
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant">
            Dos capítulos para afinar cada propuesta: qué le inspira y con qué datos
            viajamos. Todo lo que escriba aquí orienta la preparación de sus travesías.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-dashed border-parchment-border pt-4">
            <span className="coord">
              Última actualización · {formatearFecha(preferencias.actualizado_en)}
            </span>
            <span className="coord">La Paz · Bolivia</span>
            <span className="coord">16°30′ S · 68°09′ W</span>
          </div>
        </div>
      </header>

      {error && <ErrorNota texto={error} />}

      {/* --- Capítulo I --- */}
      <Capitulo
        numero="I"
        kicker="Capítulo I · La brújula"
        titulo="Estilo de exploración e intereses"
        nota="Marque los aires que le atraen y fije el techo de su próximo viaje."
        icono={<IconoCorazon className="h-4 w-4" />}
      >
        <PreferenciasForm preferencias={preferencias} onGuardado={recargarPreferencias} />
      </Capitulo>

      {/* --- Capítulo II --- */}
      <Capitulo
        numero="II"
        kicker="Capítulo II · El pasaporte"
        titulo="Ficha del viajero"
        nota="Como aparecerán en sus reservas, pasaportes y documentación de viaje."
        icono={<IconoPasaporte className="h-4 w-4" />}
      >
        <PerfilViajeroForm perfil={perfil} onGuardado={recargarPerfil} />
      </Capitulo>

      <p className="nota-manuscrita mt-8 text-center">
        Cada capítulo que selle afina la travesía que estamos preparando para usted.
      </p>
    </div>
  )
}
