import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { iaApi } from '@/api/ia'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoCalendario,
  IconoCorazon,
  IconoDestello,
  IconoEtiqueta,
  IconoFlechaDerecha,
  IconoMapa,
  IconoMoneda,
} from '@/components/ui/Iconos'
import type {
  Recomendacion,
  RespuestaRecomendaciones,
} from '@/types/ia.types'
import { textoInteres } from '@/utils/catalogos'
import { formatearFecha, formatearMoneda } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'

/** 42. Mi viaje · Pensado para ti → /mi-cuenta/recomendaciones */
export function RecomendacionesView() {
  const [datos, setDatos] = useState<RespuestaRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [aceptando, setAceptando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (forzar = false) => {
    if (forzar) setActualizando(true)
    else setCargando(true)
    setError(null)
    try {
      setDatos(await iaApi.recomendaciones(forzar))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const aceptar = async (recomendacion: Recomendacion) => {
    setAceptando(recomendacion.id)
    try {
      const actualizada = await iaApi.aceptarRecomendacion(recomendacion.id)
      setDatos((previo) =>
        previo
          ? {
              ...previo,
              recomendaciones: previo.recomendaciones.map((item) =>
                item.id === actualizada.id ? actualizada : item,
              ),
            }
          : previo,
      )
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setAceptando(null)
    }
  }

  if (cargando) {
    return (
      <p className="nota-manuscrita text-stamp-sepia">
        Consultando sus preferencias y armando una propuesta...
      </p>
    )
  }

  const intereses = datos?.preferencias?.intereses ?? []
  const recomendaciones = datos?.recomendaciones ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-lg border border-parchment-border bg-surface-container-low shadow-paper">
        <div aria-hidden className="papel-grano pointer-events-none absolute inset-0" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="coord inline-flex items-center gap-2 text-terracotta">
              <IconoDestello className="h-4 w-4" />
              Recomendador content-based
            </span>
            <h1 className="mt-3 font-display text-3xl leading-tight text-on-surface sm:text-4xl">
              Pensado para ti
            </h1>
            <p className="mt-3 font-sans text-sm leading-relaxed text-on-surface-variant">
              Cruzamos sus intereses, su presupuesto y la disponibilidad de salidas
              para proponerle una selección de travesías.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {datos?.modelo && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-sans text-[10px] uppercase tracking-wider text-tertiary">
                Modelo {datos.modelo.version}
              </span>
            )}
            <Button
              variante="ghost"
              tamano="sm"
              onClick={() => void cargar(true)}
              disabled={actualizando}
            >
              {actualizando ? 'Recalculando...' : 'Actualizar sugerencias'}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <p className="mt-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      <section className="mt-6 grid gap-4 rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper sm:grid-cols-3">
        <div>
          <p className="coord">Intereses declarados</p>
          <p className="mt-1.5 font-sans text-sm text-on-surface">
            {intereses.length
              ? intereses.map((interes) => textoInteres(interes)).join(' · ')
              : 'Aún sin intereses marcados'}
          </p>
        </div>
        <div>
          <p className="coord">Techo de viaje</p>
          <p className="mt-1.5 font-sans text-sm text-on-surface">
            {datos?.preferencias?.presupuesto_max
              ? formatearMoneda(
                  datos.preferencias.presupuesto_max,
                  datos.preferencias.moneda,
                )
              : 'Sin presupuesto definido'}
          </p>
        </div>
        <div>
          <p className="coord">Último cálculo</p>
          <p className="mt-1.5 font-sans text-sm text-on-surface">
            {datos?.generada_en ? formatearFecha(datos.generada_en) : 'Pendiente'}
          </p>
        </div>
      </section>

      {!intereses.length && (
        <p className="mt-4 rounded-md border border-dashed border-gold/50 bg-gold/5 px-4 py-3 font-sans text-xs text-on-surface-variant">
          Para afinar la selección, complete sus{' '}
          <Link
            to="/mi-cuenta/preferencias"
            className="font-semibold text-primary underline decoration-terracotta/50 underline-offset-2"
          >
            preferencias de viaje
          </Link>
          .
        </p>
      )}

      {recomendaciones.length === 0 ? (
        <div className="mt-8 rounded-lg border border-parchment-border bg-surface-container-lowest p-8 text-center shadow-paper">
          <p className="nota-manuscrita text-stamp-sepia">
            Aún no hay paquetes activos que podamos proponerle.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {recomendaciones.map((recomendacion) => (
            <TarjetaRecomendacion
              key={recomendacion.id}
              recomendacion={recomendacion}
              aceptando={aceptando === recomendacion.id}
              onAceptar={() => void aceptar(recomendacion)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TarjetaRecomendacion({
  recomendacion,
  aceptando,
  onAceptar,
}: {
  recomendacion: Recomendacion
  aceptando: boolean
  onAceptar: () => void
}) {
  const { paquete } = recomendacion

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper transition-all hover:-translate-y-1 hover:shadow-paper-lg">
      <div className="relative h-44 overflow-hidden bg-secondary/10">
        {paquete.destino_imagen ? (
          <img
            src={paquete.destino_imagen}
            alt={paquete.destino_nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary text-on-secondary">
            <IconoMapa className="h-10 w-10 opacity-50" />
          </div>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur">
          <IconoDestello className="h-3 w-3" />
          {recomendacion.puntaje_porcentaje}% afinidad
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="coord inline-flex items-center gap-1.5">
          <IconoMapa className="h-3.5 w-3.5 text-terracotta" />
          {paquete.destino_nombre} · {paquete.destino_pais}
        </p>
        <h2 className="mt-2 font-display text-xl leading-tight text-on-surface">
          {paquete.nombre}
        </h2>
        <p className="mt-2 line-clamp-2 font-sans text-xs leading-relaxed text-on-surface-variant">
          {paquete.descripcion ?? 'Una travesía preparada por Illimani.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {paquete.etiquetas.slice(0, 3).map((etiqueta) => (
            <span
              key={etiqueta}
              className="inline-flex items-center gap-1 rounded-full border border-parchment-border px-2 py-1 font-sans text-[10px] uppercase tracking-wider text-on-surface-variant"
            >
              <IconoEtiqueta className="h-3 w-3" />
              {etiqueta}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed border-parchment-border pt-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs text-on-surface-variant">
            <IconoCalendario className="h-4 w-4 text-terracotta" />
            {paquete.duracion_dias} días
          </span>
          <span className="inline-flex items-center gap-1.5 font-sans text-xs text-on-surface-variant">
            <IconoMoneda className="h-4 w-4 text-terracotta" />
            {formatearMoneda(paquete.precio_base, paquete.moneda)}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            to={`/viajes/${paquete.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-terracotta px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-primary-container"
          >
            Ver paquete
            <IconoFlechaDerecha className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onAceptar}
            disabled={aceptando || recomendacion.aceptada === true}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-sans text-[11px] font-medium uppercase tracking-wider transition-colors ${
              recomendacion.aceptada === true
                ? 'border-gold/50 bg-gold/10 text-tertiary'
                : 'border-outline-variant text-on-surface hover:border-terracotta hover:text-primary'
            }`}
          >
            <IconoCorazon className="h-4 w-4" />
            {recomendacion.aceptada === true
              ? 'Elegida'
              : aceptando
                ? 'Guardando...'
                : 'Me interesa'}
          </button>
        </div>
      </div>
    </article>
  )
}
