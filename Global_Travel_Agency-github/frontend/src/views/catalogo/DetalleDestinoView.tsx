import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'

import { catalogoApi, type Destino, type ItinerarioDia } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import {
  IconoBillete,
  IconoCalendario,
  IconoCasa,
  IconoEscudo,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoGlobo,
  IconoGrupo,
  IconoLapiz,
  IconoLibro,
  IconoMapa,
  IconoReloj,
  IconoSobre,
  IconoSol,
} from '@/components/ui/Iconos'
import {
  coordenadas,
  latitudCorta,
  longitudCorta,
  nombrePais,
  precioDesde,
} from '@/lib/editorial'

/* ── Piezas editoriales ────────────────────────────────────────────────────── */

/**
 * Segunda fotografía de la ficha, sólo cuando existe un encuadre real del mismo
 * enclave. Si no la hay, la ficha muestra una sola lámina a sangre.
 */
const IMAGEN_SECUNDARIA: Record<string, { src: string; pie: string }> = {
  'kioto-y-takayama-japon': { src: '/assets/destino-6.jpg', pie: 'Kioto · Jardín zen al amanecer' },
  'machu-picchu-peru': { src: '/assets/destino-15.jpg', pie: 'Valle Sagrado · Terrazas de piedra' },
  'valle-sagrado-de-los-incas-peru': {
    src: '/assets/proveedor-1.jpg',
    pie: 'Valle Sagrado · Hacienda de adobe',
  },
}

/** Repertorio de iconos para las inclusiones de la expedición. */
const ICONOS_INCLUYE = [IconoMapa, IconoCasa, IconoGrupo, IconoSol, IconoBillete, IconoLibro]

const pad = (n: number) => String(n).padStart(2, '0')

/** Agrupa el itinerario en actos de tres etapas, como un diario de ruta. */
function agruparActos(itinerario: ItinerarioDia[]): ItinerarioDia[][] {
  const orden = [...itinerario].sort((a, b) => a.numero_dia - b.numero_dia)
  const actos: ItinerarioDia[][] = []
  for (let i = 0; i < orden.length; i += 3) actos.push(orden.slice(i, i + 3))
  return actos
}

interface Tramo {
  nombre: string
  dias: string
}

/** Tramos de la ruta: cada lugar con el rango de días en que se visita. */
function tramosRuta(itinerario: ItinerarioDia[]): Tramo[] {
  const mapa = new Map<string, number[]>()
  for (const dia of [...itinerario].sort((a, b) => a.numero_dia - b.numero_dia)) {
    if (!dia.ubicacion) continue
    const lista = mapa.get(dia.ubicacion) ?? []
    lista.push(dia.numero_dia)
    mapa.set(dia.ubicacion, lista)
  }
  return [...mapa.entries()].map(([nombre, dias]) => ({
    nombre,
    dias:
      dias.length > 1
        ? `Días ${pad(dias[0])}–${pad(dias[dias.length - 1])}`
        : `Día ${pad(dias[0])}`,
  }))
}

/** Separa «Marzo a mayo (Sakura)» en valor principal y detalle entre paréntesis. */
function partirEpoca(texto: string | null): [string | null, string | null] {
  if (!texto) return [null, null]
  const i = texto.indexOf('(')
  if (i === -1) return [texto, null]
  return [texto.slice(0, i).trim().replace(/\s+y$/, ''), texto.slice(i).trim()]
}

/* ── Vista ─────────────────────────────────────────────────────────────────── */

/** #16 Ficha de destino — /destinos/:id */
export function DetalleDestinoView() {
  const { id } = useParams<{ id: string }>()
  const [destino, setDestino] = useState<Destino | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setCargando(true)
    setError(false)
    catalogoApi
      .obtenerDestino(Number(id))
      .then(setDestino)
      .catch(() => setError(true))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <RosaVientos className="h-12 w-12 animate-spin text-gold" />
      </div>
    )
  }

  if (error || !destino) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <RosaVientos className="h-16 w-16 text-on-surface-variant opacity-30" />
        <p className="font-display text-3xl text-on-surface">Destino no encontrado</p>
        <p className="max-w-sm font-sans text-sm text-on-surface-variant">
          Este enclave no figura en el atlas o fue retirado del catálogo.
        </p>
        <Link
          to="/destinos"
          className="mt-2 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
        >
          <IconoFlechaIzquierda className="h-4 w-4" />
          Volver al atlas
        </Link>
      </div>
    )
  }

  const pais = nombrePais(destino.pais, destino.pais_codigo)
  const imagen = destino.imagen_principal ?? '/assets/hero-andes.jpg'
  const secundaria = IMAGEN_SECUNDARIA[destino.slug ?? '']
  const coordCorta = [latitudCorta(destino.latitud), longitudCorta(destino.longitud)]
    .filter(Boolean)
    .join(' · ')
  const coordCompleta = coordenadas(destino.latitud, destino.longitud)
  const archivo = `Archivo N° ${String(destino.id).padStart(3, '0')}-${
    destino.pais_codigo ?? 'EXP'
  }`
  const [epocaPrincipal, epocaDetalle] = partirEpoca(destino.mejor_epoca)
  const precio = precioDesde(destino.precio_desde, destino.moneda)
  const actos = agruparActos(destino.itinerario)
  const tramos = tramosRuta(destino.itinerario)
  const incluye = destino.incluye ?? []
  const noIncluye = destino.no_incluye ?? []
  const selloEstilo = [pais.toUpperCase(), destino.caracter_display?.toUpperCase()]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-surface">
      {/* ── 1. Cabecera inmersiva ─────────────────────────────────────────── */}
      <section className="relative bg-surface-container-low pb-16">
        <div className="relative h-[520px] w-full overflow-hidden sm:h-[600px] lg:h-[680px]">
          <img
            src={imagen}
            alt={`${destino.nombre}, ${pais}`}
            className="h-full w-full scale-105 object-cover object-center transition-transform duration-1000 ease-out hover:scale-100"
          />

          {/* Atmósfera de papel */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/72 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-on-surface/20 via-transparent to-transparent" />

          {/* Marcas cartográficas y sello de autor */}
          <div className="absolute inset-x-0 top-6 z-10">
            <div className="mx-auto flex max-w-7xl items-start justify-between px-6 lg:px-12">
              <div className="flex items-center gap-2 rounded-full bg-surface/90 px-4 py-1.5 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="coord uppercase tracking-widest text-on-surface">
                  {coordCorta ? `${coordCorta} · ` : ''}
                  {archivo}
                </span>
              </div>

              <div
                aria-hidden
                className="pointer-events-none hidden h-28 w-28 -rotate-6 flex-col items-center justify-center rounded-full bg-surface-container/80 shadow-md backdrop-blur-md lg:flex"
              >
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <RosaVientos className="h-6 w-6 text-primary" />
                  <span className="mt-1 font-sans text-[9px] font-bold uppercase tracking-widest text-primary">
                    Illimani
                  </span>
                  <span className="font-sans text-[8px] uppercase tracking-tighter text-on-surface-variant">
                    Sello de autor
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Título editorial */}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-12 lg:pb-24">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="flex max-w-3xl flex-col gap-3 text-on-surface"
              >
                <div className="inline-flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-primary px-3 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-widest text-on-primary">
                    Expedición privada
                  </span>
                  {selloEstilo && (
                    <span className="rounded-sm bg-surface-container-high/80 px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {selloEstilo}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-4xl font-normal leading-[1.02] tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
                  {destino.nombre}
                </h1>

                {destino.resumen && (
                  <p className="max-w-2xl font-display text-base font-light italic leading-relaxed text-on-surface-variant sm:text-lg">
                    {destino.resumen}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── 2. Franja de datos esenciales ─────────────────────────────────── */}
        <div className="relative z-20 mx-auto -mt-12 max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-5 rounded-xl bg-surface-container-lowest p-6 shadow-xl sm:grid-cols-2 lg:grid-cols-5 lg:p-8">
            {/* Mejor época */}
            <div className="flex flex-col gap-1 p-1">
              <span className="coord flex items-center gap-1 uppercase tracking-widest text-tertiary">
                <IconoCalendario className="h-3.5 w-3.5" />
                Mejor época
              </span>
              <span className="font-sans text-sm font-medium leading-snug text-on-surface">
                {epocaPrincipal ?? 'Todo el año'}
              </span>
              {epocaDetalle && (
                <span className="coord uppercase text-on-surface-variant">{epocaDetalle}</span>
              )}
            </div>

            {/* Duración */}
            <div className="flex flex-col gap-1 p-1">
              <span className="coord flex items-center gap-1 uppercase tracking-widest text-tertiary">
                <IconoReloj className="h-3.5 w-3.5" />
                Duración ideal
              </span>
              <span className="font-sans text-sm font-medium text-on-surface">
                {destino.duracion_dias
                  ? `${destino.duracion_dias} días${
                      destino.duracion_noches ? ` / ${destino.duracion_noches} noches` : ''
                    }`
                  : 'A medida'}
              </span>
              <span className="coord uppercase text-on-surface-variant">Ritmo sosegado</span>
            </div>

            {/* Carácter */}
            <div className="flex flex-col gap-1 p-1">
              <span className="coord flex items-center gap-1 uppercase tracking-widest text-tertiary">
                <IconoLibro className="h-3.5 w-3.5" />
                Carácter
              </span>
              <span className="line-clamp-1 font-sans text-sm font-medium text-on-surface">
                {destino.caracter_display ?? 'Viaje de autor'}
              </span>
              <span className="coord uppercase text-on-surface-variant">
                {destino.region_display ?? pais}
              </span>
            </div>

            {/* Inversión */}
            <div className="flex flex-col gap-1 p-1">
              <span className="coord flex items-center gap-1 uppercase tracking-widest text-tertiary">
                <IconoBillete className="h-3.5 w-3.5" />
                Inversión de autor
              </span>
              <span className="font-display text-2xl font-semibold text-primary">
                {precio ?? 'A consultar'}
              </span>
              <span className="coord uppercase text-on-surface-variant">
                Desde · por persona
              </span>
            </div>

            {/* CTA */}
            <div className="flex pt-2 sm:col-span-2 lg:col-span-1 lg:justify-end lg:pt-0">
              <a
                href="#concierge"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg lg:w-auto"
              >
                Diseñar este viaje
                <IconoFlechaDerecha className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Cuerpo editorial ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Columna principal */}
          <div className="flex flex-col gap-12 lg:col-span-8">
            {/* Introducción */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-widest text-primary">
                <IconoLibro className="h-4 w-4" />
                Capítulo {pais} · Cuaderno de ruta
              </div>
              <h2 className="font-display text-3xl font-normal leading-tight tracking-tight text-on-surface sm:text-4xl">
                {destino.lema ?? destino.resumen ?? destino.nombre}
              </h2>
              <p className="font-sans text-base leading-relaxed text-on-surface-variant">
                {destino.descripcion ??
                  'La crónica completa de este enclave se está escribiendo en nuestro cuaderno de campo.'}
              </p>
            </div>

            {/* Mosaico fotográfico */}
            <div className={secundaria ? 'grid grid-cols-1 gap-5 sm:grid-cols-2' : ''}>
              <figure className="group relative h-80 overflow-hidden rounded-lg bg-surface-container shadow-sm">
                <img
                  src={imagen}
                  alt={`${destino.nombre}, ${pais}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <figcaption className="absolute bottom-3 left-3 rounded bg-surface/90 px-3 py-1 font-sans text-[10px] uppercase tracking-wider text-on-surface backdrop-blur-sm">
                  {destino.nombre} · {destino.region_display ?? pais}
                </figcaption>
              </figure>

              {secundaria && (
                <figure className="group relative h-80 overflow-hidden rounded-lg bg-surface-container shadow-sm">
                  <img
                    src={secundaria.src}
                    alt={secundaria.pie}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded bg-surface/90 px-3 py-1 font-sans text-[10px] uppercase tracking-wider text-on-surface backdrop-blur-sm">
                    {secundaria.pie}
                  </figcaption>
                </figure>
              )}
            </div>

            {/* Itinerario */}
            {actos.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl font-normal text-on-surface">
                    Extracto del diario de ruta
                  </h3>
                  <span className="coord uppercase text-on-surface-variant/60">
                    {destino.itinerario.length} etapas seleccionadas
                  </span>
                </div>

                {actos.map((acto, indice) => {
                  const primero = acto[0].numero_dia
                  const ultimo = acto[acto.length - 1].numero_dia
                  const lugares = Array.from(
                    new Set(acto.map((d) => d.ubicacion).filter(Boolean)),
                  ).join(' · ')

                  return (
                    <article
                      key={`${primero}-${indice}`}
                      className="relative rounded-xl bg-surface-container-low p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <span className="rounded bg-surface-container-highest px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Días {pad(primero)} — {pad(ultimo)}
                        </span>
                        {lugares && (
                          <span className="coord uppercase tracking-widest text-on-surface-variant">
                            {lugares}
                          </span>
                        )}
                      </header>

                      <div className="flex flex-col gap-5">
                        {acto.map((dia) => (
                          <div key={dia.id} className="flex gap-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest font-sans text-xs font-semibold text-primary">
                              {pad(dia.numero_dia)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="font-display text-lg font-semibold leading-snug text-on-surface">
                                  {dia.titulo}
                                </h4>
                                {dia.ubicacion && (
                                  <span className="coord uppercase tracking-wider text-tertiary">
                                    {dia.ubicacion}
                                  </span>
                                )}
                              </div>
                              {dia.descripcion && (
                                <p className="mt-1 font-sans text-sm leading-relaxed text-on-surface-variant">
                                  {dia.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Privilegios / inclusiones */}
            {incluye.length > 0 && (
              <div className="flex flex-col gap-6 rounded-2xl bg-surface-container p-6 lg:p-8">
                <div className="flex flex-col gap-1">
                  <span className="coord font-semibold uppercase tracking-widest text-primary">
                    Privilegios reservados
                  </span>
                  <h3 className="font-display text-2xl font-normal tracking-tight text-on-surface">
                    Lo que el atelier resuelve por ti
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {incluye.map((item, i) => {
                    const Icono = ICONOS_INCLUYE[i % ICONOS_INCLUYE.length]
                    return (
                      <div
                        key={item}
                        className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-5 shadow-sm"
                      >
                        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icono className="h-5 w-5" />
                        </div>
                        <h5 className="font-display text-lg font-medium leading-snug text-on-surface">
                          {item}
                        </h5>
                        <p className="coord uppercase text-on-surface-variant">
                          Incluido en la expedición
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Barra lateral */}
          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* Cartografía */}
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="coord font-medium uppercase tracking-wider text-on-surface-variant">
                  Coordenadas del itinerario
                </span>
                <IconoGlobo className="h-4 w-4 text-primary" />
              </div>

              <div className="relative h-56 overflow-hidden rounded-lg bg-secondary">
                <img
                  src={imagen}
                  alt={`Cartografía de ${destino.nombre}`}
                  className="h-full w-full object-cover opacity-85"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                <RosaVientos className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-surface/50" />
                <div className="absolute bottom-2 left-2 rounded bg-surface/90 px-2 py-1 font-sans text-[10px] uppercase tracking-wider text-on-surface backdrop-blur-md">
                  {destino.region_display ?? pais} · {pais}
                </div>
              </div>

              {tramos.length > 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  {tramos.map((tramo, i) => (
                    <div
                      key={tramo.nombre}
                      className="flex items-center justify-between font-sans text-sm text-on-surface"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ['bg-primary', 'bg-tertiary', 'bg-secondary'][i % 3]
                          }`}
                        />
                        {tramo.nombre}
                      </span>
                      <span className="coord text-on-surface-variant">{tramo.dias}</span>
                    </div>
                  ))}
                </div>
              )}

              {coordCompleta && (
                <div className="border-t border-outline-variant/40 pt-3">
                  <p className="coord uppercase tracking-widest text-on-surface-variant">
                    {coordCompleta}
                  </p>
                </div>
              )}
            </div>

            {/* Transparencia */}
            {noIncluye.length > 0 && (
              <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-sm">
                <h4 className="flex items-center gap-2 font-display text-lg font-medium text-on-surface">
                  <IconoEscudo className="h-5 w-5 text-primary" />
                  Transparencia de la expedición
                </h4>
                <ul className="flex flex-col gap-3">
                  {noIncluye.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-sans text-sm leading-relaxed text-on-surface-variant"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-outline" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="coord uppercase text-on-surface-variant/70">
                  Todo lo demás corre por cuenta del atelier
                </p>
              </div>
            )}

            {/* Curaduría */}
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                  <RosaVientos className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-primary">
                    Curaduría Illimani
                  </span>
                  <span className="font-display text-lg font-medium text-on-surface">
                    Atelier de expediciones
                  </span>
                  <span className="coord text-on-surface-variant">La Paz, Bolivia</span>
                </div>
              </div>
              <p className="font-display text-sm italic leading-relaxed text-on-surface-variant">
                «Cada ficha pasa por revisión de nuestro equipo: rutas, estancias y tiempos se
                eligen por su carácter, no por su popularidad.»
              </p>
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:text-terracotta"
              >
                Conversar con un curador
                <IconoFlechaDerecha className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ── 4. Concierge ──────────────────────────────────────────────────── */}
      <section id="concierge" className="w-full scroll-mt-24 bg-surface-container py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconoLapiz className="h-6 w-6" />
          </div>
          <span className="coord font-semibold uppercase tracking-widest text-tertiary">
            Diálogo directo · sin intermediarios
          </span>
          <h2 className="max-w-2xl font-display text-3xl font-normal leading-tight text-on-surface sm:text-4xl">
            Converse con nuestro especialista en {destino.region_display ?? pais} para dar forma a
            su itinerario
          </h2>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-on-surface-variant">
            Cada expedición es un manuscrito único. Adaptamos fechas, ritmo diario, alojamientos y
            experiencias según sus inquietudes artísticas y culturales.
          </p>

          <div className="mt-2 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/registro"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg sm:w-auto"
            >
              <IconoCalendario className="h-4 w-4" />
              Agendar llamada privada
            </Link>
            <a
              href={`mailto:contacto@illimanitravel.bo?subject=${encodeURIComponent(
                `Consulta de expedición · ${destino.nombre}`,
              )}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface shadow-sm transition-all hover:bg-surface-container-high sm:w-auto"
            >
              <IconoSobre className="h-4 w-4" />
              Escribir al atelier
            </a>
          </div>

          <span className="coord mt-1 uppercase tracking-widest text-on-surface-variant/70">
            Atención personalizada en español · Despacho en La Paz, Bolivia
          </span>
        </div>
      </section>
    </div>
  )
}