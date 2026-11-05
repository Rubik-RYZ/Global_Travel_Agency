import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import {
  IconoCerrar,
  IconoFlechaDerecha,
  IconoLibro,
  IconoLupa,
  IconoMapa,
  IconoReloj,
  IconoSol,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { CARACTERES, ORDEN_REGIONES, useCuadernoDestinos } from '@/hooks/useCuadernoDestinos'
import {
  NOTA_MANO,
  etiquetaRegion,
  latitudCorta,
  longitudCorta,
  nombrePais,
} from '@/lib/editorial'

/* ── Piezas cartográficas ──────────────────────────────────────────────────── */

/** Retícula de latitudes y longitudes que da textura de archivo al atlas. */
function ReticulaCartografica() {
  return (
    <svg className="h-full w-full text-outline-variant/30" aria-hidden>
      <defs>
        <pattern id="ret-grid-catalogo" width="160" height="160" patternUnits="userSpaceOnUse">
          <path
            d="M 160 0 L 0 0 0 160"
            fill="none"
            stroke="currentColor"
            strokeDasharray="4 8"
            strokeWidth="0.5"
          />
          <circle cx="160" cy="160" r="1.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ret-grid-catalogo)" />
    </svg>
  )
}

/** Sello de registro del encabezado (tinta desfasada, como un archivo). */
function SelloRegistro() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-12 -top-4 hidden h-24 w-24 rotate-12 select-none items-center justify-center rounded-full border-2 border-dashed border-primary/25 md:flex"
    >
      <div className="flex flex-col items-center text-center text-primary/70">
        <span className="font-sans text-[8px] font-semibold uppercase tracking-widest">
          Registro N° 402
        </span>
        <span className="font-display text-[11px] font-semibold italic">MMXXVI</span>
        <span className="font-sans text-[7px] uppercase tracking-tighter">Atlas Illimani</span>
      </div>
    </div>
  )
}

/** Matasellos circular de cada lámina: país, latitud y sello de origen. */
function SelloDestino({ destino }: { destino: DestinoResumen }) {
  const lat = latitudCorta(destino.latitud)
  const codigo = destino.pais_codigo ?? 'EXP'
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-4 top-3 z-20 rotate-[8deg] select-none"
    >
      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border border-dotted border-primary/60 bg-surface/70 p-1 backdrop-blur-sm">
        <span className="font-sans text-[7px] font-bold uppercase tracking-tighter text-primary">
          {codigo}
        </span>
        <span className="font-sans text-[9px] font-semibold leading-tight text-primary">
          {lat ?? '—'}
        </span>
        <span className="font-sans text-[6px] uppercase tracking-widest text-primary">
          {nombrePais(destino.pais, destino.pais_codigo)}
        </span>
      </div>
    </div>
  )
}

/* ── Filtros ───────────────────────────────────────────────────────────────── */

interface ChipProps {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
  tono?: 'primary' | 'secondary'
}

function Chip({ activo, onClick, children, tono = 'primary' }: ChipProps) {
  const activoClase =
    tono === 'primary'
      ? 'bg-primary text-on-primary shadow-sm hover:bg-primary-container'
      : 'bg-secondary text-on-secondary shadow-sm hover:bg-secondary-container hover:text-on-secondary-container'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-all ${
        activo
          ? activoClase
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}

/* ── Lámina de destino ─────────────────────────────────────────────────────── */

function LaminaDestino({ destino, indice }: { destino: DestinoResumen; indice: number }) {
  const nota = NOTA_MANO[destino.slug ?? ''] ?? destino.region_display ?? 'Ruta de autor'
  const region = destino.region
    ? etiquetaRegion(destino.region, destino.region_display)
    : nombrePais(destino.pais, destino.pais_codigo)
  const lon = longitudCorta(destino.longitud)
  const rotacion = indice % 2 === 0 ? '-rotate-[5deg]' : 'rotate-[4deg]'

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + indice * 0.06, duration: 0.45, ease: 'easeOut' }}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest/80 p-4 shadow-[0_4px_24px_rgba(45,59,50,0.06)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_18px_44px_rgba(45,59,50,0.12)]"
    >
      {/* Anotación manuscrita que se asoma sobre la foto */}
      <div
        className={`pointer-events-none absolute left-6 top-4 z-20 select-none ${rotacion}`}
      >
        <span className="rounded bg-surface-container-low/90 px-2 py-0.5 font-hand text-[19px] italic leading-tight text-ink-warm shadow-sm">
          {nota}
        </span>
      </div>

      <SelloDestino destino={destino} />

      {/* Lámina 4/5 */}
      <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-container shadow-inner">
        {destino.imagen_principal ? (
          <img
            src={destino.imagen_principal}
            alt={`${destino.nombre}, ${nombrePais(destino.pais, destino.pais_codigo)}`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <RosaVientos className="h-20 w-20 text-gold opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent opacity-60" />

        {/* Píldora de duración */}
        {destino.duracion_dias && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
            <IconoReloj className="h-3 w-3 text-tertiary" />
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface">
              {destino.duracion_dias} días
            </span>
          </div>
        )}
      </div>

      {/* Ficha editorial */}
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between gap-2 text-secondary">
          <span className="coord uppercase tracking-widest">{region}</span>
          <span className="coord font-medium text-tertiary">
            HITO {String(indice + 1).padStart(2, '0')}
          </span>
        </div>

        <h2 className="mb-2 font-display text-xl font-semibold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary">
          {nombrePais(destino.pais, destino.pais_codigo)} · {destino.nombre}
        </h2>

        <p className="mb-4 flex-1 font-sans text-sm leading-relaxed text-on-surface-variant">
          {destino.resumen ?? destino.caracter_display ?? 'Un enclave trazado por nuestro atelier.'}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-2.5">
          <Link
            to={`/destinos/${destino.id}`}
            className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors group-hover:text-primary-container"
          >
            Explorar cuaderno de ruta
            <IconoFlechaDerecha className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
          {lon && <span className="coord text-on-surface-variant/70">{lon}</span>}
        </div>
      </div>
    </motion.article>
  )
}

/* ── Expedición insignia (panorama partido) ────────────────────────────────── */

function ExpedicionInsignia({ destinos }: { destinos: DestinoResumen[] }) {
  const salar = destinos.find((d) => d.slug === 'salar-de-uyuni-bolivia')
  const tiwanaku = destinos.find((d) => d.slug === 'tiwanaku-bolivia')
  if (!salar || !tiwanaku) return null

  const dias = (salar.duracion_dias ?? 0) + (tiwanaku.duracion_dias ?? 0)
  const noches = (salar.duracion_noches ?? 0) + (tiwanaku.duracion_noches ?? 0)
  const salidas = (salar.mejor_epoca ?? '').replace(/\s*\(.*\)\s*$/, '')
  const coord = [latitudCorta(salar.latitud), longitudCorta(salar.longitud)]
    .filter(Boolean)
    .join(' · ')
  const hito = String(destinos.length + 1).padStart(2, '0')

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
      className="mt-16 overflow-hidden rounded-2xl bg-surface-container-low/95 shadow-[0_6px_30px_rgba(45,59,50,0.06)] backdrop-blur-md"
    >
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
        {/* Panorama */}
        <div className="relative min-h-[380px] overflow-hidden bg-surface-container lg:col-span-7 lg:min-h-[460px]">
          {salar.imagen_principal && (
            <img
              src={salar.imagen_principal}
              alt="Salar de Uyuni y la piedra ceremonial de Tiwanaku"
              className="h-full w-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface-container-low/90 hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent lg:hidden" />

          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <span className="coord font-semibold uppercase text-tertiary">
              {coord ?? 'ALTIPLANO'}
            </span>
            <span className="text-outline-variant">|</span>
            <span className="coord font-semibold uppercase text-on-surface">Altiplano boliviano</span>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-6 -rotate-2 select-none">
            <span className="rounded bg-surface-container-low/90 px-3 py-1 font-hand text-lg font-semibold italic text-ink-warm shadow-sm">
              El altiplano en un solo cuaderno
            </span>
          </div>
        </div>

        {/* Dossier */}
        <div className="flex flex-col justify-between p-7 lg:col-span-5 lg:p-10">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="coord font-semibold uppercase tracking-[0.2em] text-tertiary">
                Expedición insignia · Altiplano
              </span>
              <span className="rounded-full bg-tertiary-container/20 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                HITO {hito}
              </span>
            </div>

            <h3 className="mb-3 font-display text-2xl font-semibold leading-tight tracking-tight text-on-surface sm:text-3xl">
              Bolivia · Salar de Uyuni & Tiwanaku
            </h3>

            <p className="mb-6 font-display text-base italic leading-relaxed text-on-surface-variant">
              Dos cuadernos del altiplano en una sola travesía: el espejo infinito de sal y la
              piedra ceremonial que vio nacer al mundo andino.
            </p>

            <div className="mb-7 space-y-3">
              <div className="flex items-start gap-2.5">
                <IconoMapa className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                <span className="font-sans text-sm leading-relaxed text-on-surface-variant">
                  Un solo itinerario privado desde La Paz: el espejo de Uyuni y el conjunto
                  arqueológico de Tiwanaku.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <IconoSol className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                <span className="font-sans text-sm leading-relaxed text-on-surface-variant">
                  Mejor época: abril a octubre para el altiplano seco; diciembre a abril, para el
                  efecto espejo del salar.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <IconoReloj className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                <span className="font-sans text-sm leading-relaxed text-on-surface-variant">
                  <span className="font-medium text-on-surface">
                    Duración recomendada: {dias} días / {noches} noches
                  </span>{' '}
                  con traslados y guía de autor.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 pt-5 sm:flex-row">
            <Link
              to={`/destinos/${salar.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-widest text-on-primary shadow-sm transition-all hover:bg-primary-container sm:w-auto"
            >
              Explorar cuaderno de ruta
              <IconoFlechaDerecha className="h-4 w-4" />
            </Link>
            {salidas && (
              <span className="coord uppercase tracking-wider text-on-surface-variant">
                Salidas: {salidas}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

/* ── Vista principal ───────────────────────────────────────────────────────── */

/** #15 Explorar destinos — /destinos */
export function ExplorarDestinosView() {
  const [params, setParams] = useSearchParams()
  const catalogo = useCuadernoDestinos()

  const q = params.get('q') ?? ''
  const region = params.get('region') ?? ''
  const caracter = params.get('caracter') ?? ''
  const hayFiltros = Boolean(q || region || caracter)

  const [busqueda, setBusqueda] = useState(q)
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)

  // Mantiene el campo de búsqueda sincronizado con la URL (llegadas desde la portada).
  useEffect(() => {
    setBusqueda(q)
  }, [q])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const filtros: Record<string, string> = {}
    if (q) filtros.q = q
    if (region) filtros.region = region
    if (caracter) filtros.caracter = caracter

    catalogoApi
      .listarDestinos(filtros)
      .then((data) => {
        if (!vivo) return
        setDestinos(data.results)
        setTotal(data.count)
      })
      .catch(() => undefined)
      .finally(() => {
        if (vivo) setCargando(false)
      })

    return () => {
      vivo = false
    }
  }, [q, region, caracter])

  function actualizar(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params)
    if (valor) siguiente.set(clave, valor)
    else siguiente.delete(clave)
    setParams(siguiente)
  }

  function aplicarBusqueda(e: React.FormEvent) {
    e.preventDefault()
    actualizar('q', busqueda.trim())
  }

  function limpiarFiltros() {
    setBusqueda('')
    setParams({})
  }

  // Regiones presentes en el catálogo completo (no en el resultado filtrado),
  // para que las barras no se vacíen al aplicar un filtro.
  const regiones = useMemo(() => {
    const base = catalogo.length ? catalogo : destinos
    const claves = Array.from(
      new Set(base.map((d) => d.region).filter((r): r is string => Boolean(r))),
    )
    const orden = (clave: string) => {
      const i = (ORDEN_REGIONES as readonly string[]).indexOf(clave)
      return i === -1 ? 99 : i
    }
    return claves.sort((a, b) => orden(a) - orden(b))
  }, [catalogo, destinos])

  const coordenadasCabecera = useMemo(() => {
    const base = catalogo.length ? catalogo : destinos
    return base
      .map((d) => latitudCorta(d.latitud))
      .filter((v): v is string => Boolean(v))
      .slice(0, 4)
      .join(' · ')
  }, [catalogo, destinos])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdfbf7] pb-24">
      {/* Textura de archivo cartográfico */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none opacity-40 mix-blend-multiply"
      >
        <ReticulaCartografica />
        <div className="absolute -right-24 bottom-12 h-96 w-96 text-secondary/10">
          <RosaVientos className="h-full w-full opacity-30" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* ── 1. Encabezado editorial ──────────────────────────────────────── */}
        <header className="relative mx-auto mb-12 max-w-3xl pt-14 text-center">
          <SelloRegistro />

          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-outline/40" />
            <span className="coord uppercase tracking-[0.22em] text-tertiary">
              Cuaderno de geografía viva
            </span>
            <span className="h-px w-8 bg-outline/40" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-3 font-display text-5xl font-normal leading-none tracking-tight text-on-surface sm:text-6xl lg:text-7xl"
          >
            El mundo, a tu manera
          </motion.h1>

          <p className="mx-auto max-w-2xl font-display text-base italic leading-relaxed text-on-surface-variant sm:text-lg">
            Colección de enclaves trazados desde La Paz para espíritus contemplativos. Rutas a
            medida diseñadas por nuestro atelier de historiadores y naturalistas, con vocación de
            orfebre.
          </p>

          {coordenadasCabecera && (
            <div className="mt-5 flex items-center justify-center gap-3 text-secondary">
              <IconoUbicacion className="h-3.5 w-3.5 text-tertiary" />
              <span className="coord uppercase tracking-widest text-on-surface-variant/80">
                Lat. expediciones: {coordenadasCabecera}
              </span>
            </div>
          )}
        </header>

        {/* ── 2. Barra de expedición ───────────────────────────────────────── */}
        <nav
          aria-label="Filtros de expedición"
          className="mb-12 rounded-xl bg-surface-container-low/90 p-5 shadow-[0_2px_12px_rgba(45,59,50,0.04)] backdrop-blur-md"
        >
          {/* Búsqueda + recuento */}
          <div className="mb-4 flex flex-col gap-3 border-b border-outline-variant/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={aplicarBusqueda} className="relative w-full sm:max-w-xs">
              <IconoLupa className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en el atlas..."
                aria-label="Buscar destino, país o experiencia"
                className="w-full rounded-full border border-outline-variant/50 bg-surface/80 py-2 pl-9 pr-9 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('')
                    actualizar('q', '')
                  }}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary"
                >
                  <IconoCerrar className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-3">
              <span className="coord uppercase tracking-widest text-on-surface-variant">
                {cargando
                  ? 'Consultando el atlas...'
                  : `${total} ${total === 1 ? 'enclave' : 'enclaves'} en el atlas`}
              </span>
              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
                >
                  <IconoCerrar className="h-3 w-3" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Dos raíles de filtros */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <RosaVientos className="h-3.5 w-3.5 text-tertiary" />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest">
                  Región cartográfica
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip activo={!region} onClick={() => actualizar('region', '')}>
                  Todos los continentes
                </Chip>
                {regiones.map((clave) => {
                  const display = (catalogo.length ? catalogo : destinos).find(
                    (d) => d.region === clave,
                  )?.region_display
                  return (
                    <Chip
                      key={clave}
                      activo={region === clave}
                      onClick={() => actualizar('region', region === clave ? '' : clave)}
                    >
                      {etiquetaRegion(clave, display)}
                    </Chip>
                  )
                })}
              </div>
            </div>

            <div className="hidden w-px self-stretch bg-outline-variant/50 lg:block" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <IconoLibro className="h-3.5 w-3.5 text-tertiary" />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest">
                  Carácter de viaje
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip
                  tono="secondary"
                  activo={!caracter}
                  onClick={() => actualizar('caracter', '')}
                >
                  Cualquier carácter
                </Chip>
                {CARACTERES.map((c) => (
                  <Chip
                    key={c.clave}
                    tono="secondary"
                    activo={caracter === c.clave}
                    onClick={() => actualizar('caracter', caracter === c.clave ? '' : c.clave)}
                  >
                    {c.nombre}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* ── 3. Galería de destinos ───────────────────────────────────────── */}
        {cargando ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface-container-lowest/70 p-4">
                <div className="mb-4 aspect-[4/5] w-full animate-pulse rounded-xl bg-surface-container" />
                <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-surface-container" />
                <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-surface-container" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-container" />
              </div>
            ))}
          </div>
        ) : destinos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <RosaVientos className="h-16 w-16 text-on-surface-variant opacity-30" />
            <p className="font-display text-2xl text-on-surface">Este rumbo no aparece en el atlas</p>
            <p className="max-w-md font-sans text-sm leading-relaxed text-on-surface-variant">
              {q
                ? `No encontramos enclaves para «${q}». Prueba con otro término o recorre los continentes.`
                : 'No hay enclaves con esa combinación de región y carácter. Prueba ampliando la búsqueda.'}
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-2 rounded-lg border border-primary px-5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-on-primary"
            >
              Ver todos los destinos
            </button>
          </div>
        ) : (
          <main className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {destinos.map((d, i) => (
              <LaminaDestino key={d.id} destino={d} indice={i} />
            ))}
          </main>
        )}

        {/* ── 4. Expedición insignia ───────────────────────────────────────── */}
        {!hayFiltros && !cargando && (
          <ExpedicionInsignia destinos={catalogo.length ? catalogo : destinos} />
        )}

        {/* ── 5. Pie de curador ────────────────────────────────────────────── */}
        <section className="mt-16 flex flex-col items-center justify-between gap-5 rounded-xl bg-surface-container/60 p-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <IconoLibro className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display text-[17px] font-semibold text-on-surface">
                ¿Desea una cartografía de viaje no catalogada?
              </h4>
              <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
                Nuestro atelier en La Paz diseña rutas privadas en manuscrito para expediciones
                únicas.
              </p>
            </div>
          </div>
          <Link
            to="/registro"
            className="w-full shrink-0 rounded-lg bg-surface-container-highest px-6 py-3 text-center font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface transition-colors hover:bg-secondary-fixed md:w-auto"
          >
            Consultar al Atelier
          </Link>
        </section>
      </div>
    </div>
  )
}