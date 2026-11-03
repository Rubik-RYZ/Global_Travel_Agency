import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { catalogoApi, type Paquete } from '@/api/catalogo'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoCalendario,
  IconoEdificio,
  IconoFlechaDerecha,
  IconoMapa,
  IconoReloj,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

function dinero(valor: string, moneda: string): string {
  const n = Number(valor)
  if (Number.isNaN(n)) return `${moneda} —`
  return `${moneda} ${n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function fechaLarga(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** 24. Viajes · Detalle del paquete → /viajes/:id */
export function DetallePaqueteView() {
  const { id } = useParams()
  const [paquete, setPaquete] = useState<Paquete | null>(null)
  const [imagenDestino, setImagenDestino] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const data = await catalogoApi.obtenerPaquete(Number(id))
        if (activo) setPaquete(data)
      } catch (e) {
        if (activo) setError(mensajeDeError(e))
      } finally {
        if (activo) setCargando(false)
      }
    }
    if (id) void cargar()
    return () => {
      activo = false
    }
  }, [id])

  useEffect(() => {
    if (!paquete) return
    let activo = true
    catalogoApi
      .obtenerDestino(paquete.destino)
      .then((d) => {
        if (activo) setImagenDestino(d.imagen_principal)
      })
      .catch(() => undefined)
    return () => {
      activo = false
    }
  }, [paquete])

  if (cargando) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="nota-manuscrita">Abriendo la ficha del viaje...</p>
      </div>
    )
  }

  if (error || !paquete) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="font-display text-2xl text-on-surface">
          No encontramos ese viaje
        </p>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          {error ?? 'Puede que ya no esté disponible en el catálogo.'}
        </p>
        <Link
          to="/viajes"
          className="mt-6 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
        >
          Volver al catálogo
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  const salidasDisponibles = paquete.salidas.filter(
    (s) => s.cupos_disponibles > 0,
  )

  function irASalidas() {
    document.getElementById('salidas')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to="/viajes"
        className="coord inline-flex items-center gap-2 text-stamp-sepia transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span>
        Volver al cuaderno de viajes
      </Link>

      <header className="mt-6 overflow-hidden rounded-lg border border-secondary/40 bg-secondary text-surface shadow-paper-lg">
        {imagenDestino && (
          <div className="relative h-56 w-full overflow-hidden sm:h-72">
            <img
              src={imagenDestino}
              alt={paquete.destino_nombre}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/50 to-transparent" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-6 py-2.5 sm:px-10">
          <span className="coord text-gold">Ficha de viaje · {paquete.destino_nombre}</span>
          <span className="coord text-on-secondary-container">
            {paquete.duracion_dias} días · {paquete.salidas.length} salidas
          </span>
        </div>
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center gap-2">
            {paquete.etiquetas.map((etiqueta) => (
              <span
                key={etiqueta}
                className="rounded-full border border-white/20 px-2.5 py-0.5 coord text-gold"
              >
                {etiqueta}
              </span>
            ))}
          </div>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="flex max-w-2xl flex-col gap-3">
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                {paquete.nombre}
              </h1>
              <p className="font-display text-lg font-normal italic text-on-secondary-container">
                {paquete.descripcion ||
                  'Una travesía preparada por el atelier de Illimani Global Travel.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-right">
                <span className="coord block text-on-secondary-container">
                  Precio base por persona
                </span>
                <span className="font-display text-3xl text-gold">
                  {dinero(paquete.precio_base, paquete.moneda)}
                </span>
              </div>
              <Button variante="secondary" onClick={irASalidas}>
                Ver salidas y cupos
                <IconoFlechaDerecha className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper sm:p-8">
          <h2 className="font-display text-2xl text-on-surface">Datos del viaje</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="coord flex items-center gap-1.5">
                <IconoMapa className="h-3.5 w-3.5 text-terracotta" />
                Destino
              </dt>
              <dd className="font-sans text-sm text-on-surface">
                {paquete.destino_nombre}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="coord flex items-center gap-1.5">
                <IconoReloj className="h-3.5 w-3.5 text-terracotta" />
                Duración
              </dt>
              <dd className="font-sans text-sm text-on-surface">
                {paquete.duracion_dias} días
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="coord flex items-center gap-1.5">
                <IconoEdificio className="h-3.5 w-3.5 text-terracotta" />
                Hospedaje
              </dt>
              <dd className="font-sans text-sm text-on-surface">
                {paquete.hotel_nombre ?? 'A confirmar con la agencia'}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="coord flex items-center gap-1.5">
                <IconoSello className="h-3.5 w-3.5 text-terracotta" />
                Moneda
              </dt>
              <dd className="font-sans text-sm text-on-surface">{paquete.moneda}</dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-6 shadow-paper">
          <span className="coord text-primary">Estado del viaje</span>
          <p className="font-display text-xl text-on-surface">
            {salidasDisponibles.length > 0
              ? `${salidasDisponibles.length} salidas con cupos`
              : 'Sin cupos por ahora'}
          </p>
          <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
            {salidasDisponibles.length > 0
              ? 'Las fechas confirmadas aparecen en el calendario inferior. La reserva se completa con un agente.'
              : 'Consulte con la agencia para conocer nuevas fechas de salida.'}
          </p>
          <span className="coord mt-2 flex items-center gap-1.5 text-stamp-sepia">
            <IconoCalendario className="h-3.5 w-3.5" />
            {paquete.salidas.length} fechas registradas
          </span>
        </aside>
      </div>

      <section id="salidas" className="mt-10 scroll-mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-on-surface">
            Calendario de salidas
          </h2>
          <span className="coord text-stamp-sepia">Cupos por fecha</span>
        </div>

        {paquete.salidas.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-10 text-center font-sans text-sm text-on-surface-variant">
            Todavía no hay fechas publicadas para este viaje.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="coord px-5 py-3 font-normal">Fecha de salida</th>
                  <th className="coord hidden px-5 py-3 font-normal sm:table-cell">
                    Vuelos
                  </th>
                  <th className="coord px-5 py-3 font-normal">Cupos</th>
                  <th className="coord px-5 py-3 text-right font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paquete.salidas.map((salida) => (
                  <tr
                    key={salida.id}
                    className="border-b border-parchment-border/60 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-display text-lg capitalize text-on-surface">
                        {fechaLarga(salida.fecha_salida)}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant sm:table-cell">
                      {salida.vuelo_ida_numero
                        ? `Ida ${salida.vuelo_ida_numero}`
                        : 'Vuelo por asignar'}
                      {salida.vuelo_vuelta_numero
                        ? ` · Vuelta ${salida.vuelo_vuelta_numero}`
                        : ''}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm text-on-surface">
                      {salida.cupos_disponibles} / {salida.cupos_totales}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {salida.cupos_disponibles > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 coord text-on-surface-variant">
                          <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
                          Agotada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}