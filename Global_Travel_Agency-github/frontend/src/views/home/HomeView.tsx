import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import {
  IconoFlechaDerecha,
  IconoLupa,
  IconoPlay,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { CARACTERES, ORDEN_REGIONES } from '@/hooks/useCuadernoDestinos'
import { NOTA_MANO, coordenadas, precioDesde } from '@/lib/editorial'

const CAPITULOS = ['Capítulo I', 'Capítulo II', 'Capítulo III']

/* ── Ilustraciones de línea (flora de cuaderno de campo) ───────────────────── */

function RamaBotanica({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2 20 Q18 12 36 4" strokeLinecap="round" />
      <path d="M12 16 Q8 10 14 10 Q16 14 12 16 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M24 10 Q28 6 32 10 Q26 12 24 10 Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  )
}

function SelloPostal({ texto, className = '' }: { texto: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className} aria-hidden>
      <circle cx="50" cy="50" r="42" strokeWidth="1.8" strokeDasharray="4 2" />
      <circle cx="50" cy="50" r="34" strokeWidth="1" />
      <path d="M20 50 H80 M28 38 H72 M28 62 H72" strokeWidth="0.8" />
      <text
        x="50"
        y="53"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
        fontFamily="sans-serif"
      >
        {texto}
      </text>
    </svg>
  )
}

/* ── Buscador de expediciones (pergamino) ──────────────────────────────────── */

function BuscadorExpediciones() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [region, setRegion] = useState('')
  const [caracter, setCaracter] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (texto.trim()) p.set('q', texto.trim())
    if (region) p.set('region', region)
    if (caracter) p.set('caracter', caracter)
    navigate(`/destinos${p.toString() ? `?${p.toString()}` : ''}`)
  }

  const campo =
    'w-full border-0 bg-transparent p-0 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none'

  return (
    <form
      onSubmit={enviar}
      className="mx-auto my-10 flex max-w-5xl flex-col items-stretch gap-3 rounded-2xl border border-parchment-border bg-surface-bright/95 p-3 shadow-paper md:flex-row md:items-center md:rounded-full md:p-4"
    >
      {/* Destino */}
      <label className="flex w-full cursor-text items-center gap-3.5 border-b border-surface-container-highest px-4 py-2 md:w-1/3 md:border-b-0 md:border-r">
        <IconoUbicacion className="h-5 w-5 shrink-0 text-primary" />
        <span className="w-full">
          <span className="block font-sans text-[11px] font-bold uppercase tracking-wider text-on-surface">
            Destino o ruta
          </span>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Machu Picchu, Kioto, Uyuni…"
            className={campo}
          />
        </span>
      </label>

      {/* Región */}
      <label className="flex w-full items-center gap-3.5 border-b border-surface-container-highest px-4 py-2 md:w-1/4 md:border-b-0 md:border-r">
        <RosaVientos className="h-5 w-5 shrink-0 text-primary" />
        <span className="w-full">
          <span className="block font-sans text-[11px] font-bold uppercase tracking-wider text-on-surface">
            Región
          </span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full cursor-pointer appearance-none border-0 bg-transparent p-0 font-sans text-sm text-on-surface-variant focus:outline-none"
          >
            <option value="">Todas las regiones</option>
            {ORDEN_REGIONES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </span>
      </label>

      {/* Carácter */}
      <label className="flex w-full items-center gap-3.5 px-4 py-2 md:w-1/4">
        <IconoLupa className="h-5 w-5 shrink-0 text-primary" />
        <span className="w-full">
          <span className="block font-sans text-[11px] font-bold uppercase tracking-wider text-on-surface">
            Carácter de viaje
          </span>
          <select
            value={caracter}
            onChange={(e) => setCaracter(e.target.value)}
            className="w-full cursor-pointer appearance-none border-0 bg-transparent p-0 font-sans text-sm text-on-surface-variant focus:outline-none"
          >
            <option value="">Cualquier carácter</option>
            {CARACTERES.map((c) => (
              <option key={c.clave} value={c.clave}>
                {c.nombre}
              </option>
            ))}
          </select>
        </span>
      </label>

      <button
        type="submit"
        className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-secondary px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-widest text-on-secondary shadow-paper transition-all hover:bg-secondary-container md:w-auto"
      >
        Buscar ruta
        <IconoFlechaDerecha className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

/* ── Lámina de destino (tarjeta orgánica) ──────────────────────────────────── */

function LaminaDestino({ destino, indice }: { destino: DestinoResumen; indice: number }) {
  const precio = precioDesde(destino.precio_desde, destino.moneda)
  const noches = destino.duracion_noches
  const nota = NOTA_MANO[destino.slug ?? ''] ?? destino.region_display ?? 'Ruta de autor'
  const silueta = ['silueta-organica-1', 'silueta-organica-2', 'silueta-organica-3'][indice % 3]
  const desfase = ['md:mt-0', 'md:mt-8', 'md:mt-2'][indice % 3]

  return (
    <article className={`group flex flex-col ${desfase}`}>
      <div className="relative mb-2 flex h-12 items-center justify-between">
        <span className="block -rotate-3 font-hand text-2xl text-on-surface-variant">{nota}</span>
        <RamaBotanica className="h-7 w-10 text-stamp-sepia opacity-75" />
      </div>

      <div className="marco-organico mb-6 w-full rounded-[32px] bg-surface-container-highest p-1.5">
        <div className={`${silueta} h-[400px] w-full overflow-hidden bg-secondary-container lg:h-[430px]`}>
          {destino.imagen_principal ? (
            <img
              src={destino.imagen_principal}
              alt={`${destino.nombre}, ${destino.pais}`}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <RosaVientos className="h-24 w-24 text-gold opacity-40" />
            </div>
          )}
        </div>
      </div>

      <div className="relative pt-2">
        <div className="pointer-events-none absolute -top-14 right-2 h-16 w-16 opacity-65">
          <SelloPostal texto={`EXP. ${destino.pais_codigo ?? destino.pais.slice(0, 2).toUpperCase()}`} className="h-full w-full text-stamp-sepia" />
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary">
            {CAPITULOS[indice] ?? `Capítulo ${indice + 1}`}
          </span>
          {destino.duracion_dias && (
            <span className="font-mono text-[11px] text-stamp-sepia">
              {destino.duracion_dias} Días{noches ? ` · ${noches} Noches` : ''}
            </span>
          )}
        </div>

        <h3 className="font-display text-3xl font-medium tracking-tight text-ink-warm">
          {destino.pais}
        </h3>
        <p className="mt-0.5 font-display text-xs italic text-on-surface-variant">
          {destino.nombre}
          {destino.region_display ? ` · ${destino.region_display}` : ''}
        </p>

        <div className="mt-4 space-y-1.5 rounded-xl border border-outline-variant bg-surface-container-high/80 p-3.5 font-sans text-[11px]">
          {destino.mejor_epoca && (
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-stamp-sepia">Mejor época:</span>
              <span className="text-right font-medium text-on-surface">{destino.mejor_epoca}</span>
            </div>
          )}
          {destino.caracter_display && (
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-stamp-sepia">Carácter:</span>
              <span className="text-right font-medium text-on-surface">{destino.caracter_display}</span>
            </div>
          )}
          {precio && (
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-stamp-sepia">Inversión desde:</span>
              <span className="text-right font-medium text-on-surface">{precio}</span>
            </div>
          )}
        </div>

        <Link
          to={`/destinos/${destino.id}`}
          className="mt-4 inline-flex items-center gap-3 font-sans text-xs font-semibold uppercase tracking-wider text-ink-warm transition-colors group-hover:text-primary"
        >
          <span className="inline-block h-[1.5px] w-6 bg-primary" />
          Explorar itinerario detallado
          <IconoFlechaDerecha className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}

/* ── Vista principal ───────────────────────────────────────────────────────── */

/** #14 Landing pública — / */
export function HomeView() {
  const [destacados, setDestacados] = useState<DestinoResumen[]>([])

  useEffect(() => {
    let vivo = true
    catalogoApi
      .listarDestacados()
      .then((data) => {
        if (vivo) setDestacados(data.results)
      })
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [])

  const principal = destacados[0]
  const heroImg = principal?.imagen_principal ?? '/assets/hero-andes.jpg'
  const heroCoords = principal ? coordenadas(principal.latitud, principal.longitud) : null
  // Orden curado por «capítulo» (id del catálogo), estable entre cargas.
  const tarjetas = [...destacados].sort((a, b) => a.id - b.id).slice(0, 3)

  return (
    <>
      {/* ── Hero a sangre bajo la cabecera fija ───────────────────────────── */}
      <section id="expediciones" className="relative min-h-[100svh] w-full overflow-hidden bg-secondary">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImg}')`, backgroundPosition: 'center top' }}
          aria-hidden
        />
        {/* Viñetas naturalistas */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary-container via-transparent to-secondary/70" />

        {/* Marca de agua botánica (arriba a la izquierda) */}
        <div aria-hidden className="pointer-events-none absolute left-4 top-24 hidden select-none text-emerald-200/20 lg:left-12 lg:block">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-64 w-64">
            <path d="M10 190 Q60 140 100 80 T180 20" strokeLinecap="round" />
            <path d="M70 120 Q55 95 35 105 Q55 125 70 120 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M100 80 Q120 60 140 75 Q120 95 100 80 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M135 48 Q120 28 102 38 Q120 56 135 48 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M155 30 Q170 12 188 22 Q172 38 155 30 Z" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-between px-6 pb-44 pt-[120px] lg:px-12 lg:pb-56 lg:pt-[148px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl text-left"
          >
            {/* Distintivo */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-black/25 px-3.5 py-1.5 backdrop-blur-md">
              <RosaVientos className="h-3.5 w-3.5 text-gold" />
              <span className="font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-gold/90">
                Viajes de autor · Atlas de enclaves
              </span>
            </div>

            <h1 className="mb-7 font-display text-5xl font-normal leading-[0.96] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.4rem]">
              VIAJES QUE
              <br />
              CUENTAN
              <br />
              <span className="italic tracking-wide text-gold">HISTORIAS</span>
            </h1>

            <p className="mb-10 max-w-lg font-display text-base font-light italic leading-relaxed text-on-secondary/90 sm:text-lg">
              «Cada comarca conserva un murmullo que solo se revela a quien viaja con paciencia,
              curiosidad y mirada de naturalista.»
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/destinos"
                className="inline-flex items-center gap-3 rounded-full bg-terracotta px-8 py-3.5 font-sans text-xs font-medium uppercase tracking-wider text-white shadow-paper-lg transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:text-sm"
              >
                Abrir cuaderno de expedición
                <span className="text-base leading-none">→</span>
              </Link>
              <a
                href="#atelier"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-6 py-3.5 font-sans text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                Diseñar a medida
              </a>
            </div>
          </motion.div>

          {/* Crónica visual & coordenadas */}
          {principal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute bottom-32 right-6 flex flex-col items-end gap-3 text-on-secondary/90 md:bottom-40 lg:right-12"
            >
              <Link to={`/destinos/${principal.id}`} className="group flex items-center gap-3 text-right">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-black/35 backdrop-blur-md transition-all group-hover:bg-white/25">
                  <IconoPlay className="h-4 w-4 translate-x-0.5 text-gold transition-transform group-hover:scale-110" />
                </span>
                <span className="text-right">
                  <span className="block font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white">
                    Crónica de la expedición
                  </span>
                  <span className="block font-mono text-[10px] tracking-widest text-gold/80">
                    {principal.nombre.toUpperCase()}
                    {principal.duracion_dias ? ` · ${String(principal.duracion_dias).padStart(2, '0')} DÍAS` : ''}
                  </span>
                </span>
              </Link>
              {heroCoords && (
                <span className="font-mono text-[10px] tracking-widest text-white/60">{heroCoords}</span>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Pergamino de expedición ───────────────────────────────────────── */}
      <div className="papel-expedicion relative z-20 -mt-16 rounded-t-[2.5rem] border-t border-outline-variant pb-28 text-on-surface shadow-paper-lg md:rounded-t-[3.5rem] lg:-mt-24">
        {/* Grabado botánico de esquina */}
        <div aria-hidden className="pointer-events-none absolute left-8 top-6 hidden select-none text-stamp-sepia/30 lg:block">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-28 w-28">
            <path d="M10 90 Q30 50 70 30 T90 10" />
            <circle cx="70" cy="30" r="3" fill="currentColor" />
            <path d="M40 70 Q30 60 20 62 Q25 75 40 70 Z" />
            <path d="M60 45 Q70 40 75 48 Q65 52 60 45 Z" />
          </svg>
        </div>

        {/* Encabezado manuscrito */}
        <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-6 pb-2 pt-8 sm:flex-row sm:items-center sm:justify-between lg:px-12">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest text-stamp-sepia">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Registro cartográfico de expediciones privadas
          </div>
          <div className="flex items-center gap-4">
            <span className="-rotate-3 select-none font-hand text-2xl text-on-surface-variant lg:text-3xl">
              El mundo te espera…
            </span>
            <RosaVientos className="hidden h-10 w-10 text-stamp-sepia opacity-55 sm:block" />
          </div>
        </div>

        <div className="px-4 sm:px-6">
          <BuscadorExpediciones />
        </div>

        {/* ── Expediciones destacadas ─────────────────────────────────────── */}
        <section id="destinos" className="mx-auto mb-28 max-w-7xl px-6 pt-8 lg:px-12">
          <div className="mb-16 max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                Tres capítulos de colección
              </span>
              <span className="h-px w-12 bg-primary/40" />
            </div>
            <h2 className="font-display text-4xl font-normal leading-[1.05] tracking-tight text-secondary-container sm:text-5xl lg:text-6xl">
              EXPEDICIONES CON
              <br />
              <span className="italic text-primary">ALMA NATURALISTA</span>
            </h2>
            <p className="mt-4 font-display text-base italic leading-relaxed text-on-surface-variant">
              Siluetas geográficas esculpidas por el tiempo, donde cada itinerario se convierte en un
              cuaderno de campo y una memoria sensorial irrepetible.
            </p>
          </div>

          <div id="itinerarios" className="grid scroll-mt-24 grid-cols-1 items-start gap-10 md:grid-cols-3 lg:gap-12">
            {tarjetas.map((d, i) => (
              <LaminaDestino key={d.id} destino={d} indice={i} />
            ))}
          </div>

          {!destacados.length && (
            <div className="mt-6 flex justify-center">
              <Link
                to="/destinos"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
              >
                Ver el atlas completo
                <IconoFlechaDerecha className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* ── Atelier de expediciones ─────────────────────────────────────── */}
        <section id="atelier" className="mx-auto mb-28 max-w-7xl scroll-mt-24 px-6 lg:px-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-secondary-container p-8 text-on-secondary shadow-paper-lg md:p-14">
            <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 select-none text-emerald-100/15">
              <svg viewBox="0 0 200 200" fill="currentColor" className="h-96 w-96">
                <path d="M40 180 Q90 120 130 50 T190 10 Q140 70 100 130 T40 180 Z" />
                <circle cx="130" cy="50" r="18" />
                <circle cx="160" cy="30" r="12" />
              </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="mb-3 block font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Atelier de expediciones
                </span>
                <h3 className="mb-4 font-display text-3xl font-normal leading-tight text-white sm:text-4xl lg:text-5xl">
                  Diseña tu itinerario con nuestro maestro de expediciones
                </h3>
                <p className="max-w-xl font-display text-sm italic leading-relaxed text-on-secondary/80 sm:text-base">
                  No vendemos viajes estandarizados ni catálogos masivos. Cada ruta nace de una
                  conversación pausada entre el viajero y nuestro equipo en La Paz.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-4 sm:flex-row lg:col-span-5 lg:items-center">
                <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wider text-gold">
                    Cita privada
                  </span>
                  <p className="font-sans text-xs leading-snug text-on-secondary/90">
                    Consulta personalizada sin compromiso para confeccionar tu bitácora.
                  </p>
                </div>
                <Link
                  to="/registro"
                  className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-terracotta px-7 py-4 font-sans text-xs font-semibold uppercase tracking-widest text-white shadow-paper transition-all hover:bg-primary-container"
                >
                  Solicitar cita
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Manifiesto de la casa ───────────────────────────────────────── */}
        <section id="manifiesto" className="mx-auto mb-20 max-w-7xl scroll-mt-24 px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                  El código del naturalista
                </span>
                <span className="h-px w-8 bg-primary/40" />
              </div>
              <h3 className="mb-5 font-display text-3xl font-normal leading-snug text-secondary-container sm:text-4xl">
                El verdadero lujo es regresar con una mirada distinta
              </h3>
              <p className="capitular mb-4 font-sans text-sm leading-relaxed text-on-surface-variant sm:text-base">
                Entendemos el viaje no como una lista de monumentos que tachar con premura, sino como
                una travesía estética y naturalista. Caminamos senderos donde florece el silencio, nos
                alojamos en casonas que respiran historia y brindamos con caldos nacidos de bancales
                centenarios. Desde La Paz diseñamos cada ruta con el respeto de quien dibuja lo que
                ama para no olvidarlo jamás.
              </p>
              <p className="font-display text-xs italic leading-relaxed text-stamp-sepia sm:text-sm">
                «Illimani Global Travel nació para rescatar el espíritu de los ilustrados del siglo
                XVIII: aquellos exploradores que anotaban, dibujaban y cuidaban cada comarca que
                visitaban.»
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-parchment-border bg-surface-bright p-8 shadow-paper sm:p-10">
                <div className="pointer-events-none absolute -top-5 right-6 h-14 w-14 opacity-50">
                  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="h-full w-full text-primary">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" strokeWidth="2" />
                    <text
                      x="50"
                      y="54"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="currentColor"
                      stroke="none"
                      fontFamily="serif"
                    >
                      EXP. CERT.
                    </text>
                  </svg>
                </div>
                <div className="mb-3 font-display text-5xl leading-none text-primary opacity-60">“</div>
                <p className="mb-6 font-display text-sm italic leading-relaxed text-on-surface sm:text-base">
                  Un itinerario de autor es un contrato de confianza: rutas elegidas por su carácter,
                  estancias con historia propia y un equipo que responde en cada escala. Ese es el
                  cuaderno que firmamos contigo antes de partir.
                </p>
                <div className="flex items-center justify-between border-t border-surface-container-highest pt-4">
                  <div>
                    <h5 className="font-display text-base font-semibold text-ink-warm">
                      Illimani Global Travel S.R.L.
                    </h5>
                    <span className="block font-sans text-[11px] text-stamp-sepia">
                      Atelier de expediciones · La Paz, Bolivia
                    </span>
                  </div>
                  <div className="-rotate-6 select-none font-hand text-2xl font-semibold text-primary">
                    Illimani
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
