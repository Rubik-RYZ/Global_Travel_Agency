import { Link, Outlet } from 'react-router-dom'

import { RosaVientos } from '@/components/brand/RosaVientos'
import { IconoChevron, IconoGlobo, IconoEscudo } from '@/components/ui/Iconos'
import fondoMundo from '@/assets/fondo.png'

/**
 * Layout de acceso (login / registro / recuperación).
 *
 * Composición tomada de la referencia Stitch "Meridiano · Atlas de Bienvenida
 * & Acceso": cabecera editorial, columna narrativa a la izquierda y portal de
 * acceso a la derecha, cerrado por un pie de imprenta.
 *
 * La estética se re-trabaja con los tokens locales de `design.md`: una gran
 * hoja de pergamino flotando sobre un escritorio de verde bosque, la
 * ilustración `fondo.png` montada como lámina de atlas, y una línea de ruta
 * punteada que enlaza los monumentos del propio dibujo con sus coordenadas.
 */

const DESTINOS = [
  { nombre: 'Machu Picchu', coord: '13°09′ S · 72°32′ O' },
  { nombre: 'Roma', coord: '41°54′ N · 12°29′ E' },
  { nombre: 'Chichén Itzá', coord: '20°40′ N · 88°34′ O' },
  { nombre: 'Agra', coord: '27°10′ N · 78°02′ E' },
  { nombre: 'Río de Janeiro', coord: '22°57′ S · 43°12′ O' },
]

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-forest-night">
      {/* --- Atmósfera del escritorio (fija y recortada: nunca desborda) --- */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-terracotta/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1480px] flex-col p-0 sm:p-4 lg:p-7">
        {/* --- La hoja de pergamino --- */}
        <div className="relative flex flex-1 flex-col overflow-hidden border border-parchment-border/30 bg-surface shadow-paper-lg sm:rounded-[1.75rem] lg:rounded-[2.5rem]">
          {/* Texturas: retícula cartográfica + grano de papel + topónimos */}
          <div aria-hidden className="textura-carta pointer-events-none absolute inset-0 opacity-70" />
          <div aria-hidden className="papel-grano pointer-events-none absolute inset-0" />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[6%] top-[34%] -rotate-12 select-none font-display text-[7rem] font-bold uppercase tracking-[0.35em] text-on-surface/[0.03]"
          >
            Oceanus
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[16%] left-[44%] select-none font-display text-[5rem] uppercase tracking-[0.4em] text-on-surface/[0.025]"
          >
            Andes
          </span>

          <EncabezadoAuth />

          <main className="relative z-10 grid flex-1 grid-cols-1 lg:grid-cols-12">
            <NarrativaAtlas />
            <PortalAcceso />
          </main>

          <PieAuth />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function EncabezadoAuth() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 border-b border-parchment-border/70 px-6 py-4 lg:px-12">
      <Link to="/" className="flex items-center gap-3">
        <RosaVientos className="h-9 w-9 text-terracotta" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold text-on-surface">Illimani</span>
          <span className="mt-1 font-sans text-[9px] font-medium uppercase tracking-[0.26em] text-stamp-sepia">
            Global Travel
          </span>
        </span>
      </Link>

      <p className="hidden font-display text-base italic text-on-surface-variant md:block">
        El mundo se descubre; las historias se crean.
      </p>

      <div className="flex items-center gap-4 font-sans text-xs text-stamp-sepia">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-on-surface"
        >
          <IconoGlobo className="h-4 w-4" />
          Español
          <IconoChevron className="h-3 w-3" />
        </button>
        <span className="hidden h-3 w-px bg-parchment-border sm:block" />
        <Link
          to="/"
          className="hidden items-center gap-1 font-medium transition-colors hover:text-terracotta sm:inline-flex"
        >
          ¿Necesita ayuda? <span aria-hidden>↗</span>
        </Link>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */

function NarrativaAtlas() {
  return (
    <section className="relative hidden flex-col justify-between gap-8 px-10 pb-8 pt-10 lg:col-span-7 lg:flex lg:border-r lg:border-parchment-border/70 xl:px-14 xl:pt-12">
      {/* Sello postal de expedición */}
      <div
        aria-hidden
        className="absolute right-10 top-10 hidden h-24 w-24 rotate-6 items-center justify-center rounded-full border border-stamp-sepia/40 p-2 text-center xl:flex"
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-stamp-sepia/30">
          <span className="font-sans text-[7px] font-semibold uppercase tracking-[0.2em] text-stamp-sepia">
            Espíritu viajero
          </span>
          <RosaVientos className="my-1 h-4 w-4 text-stamp-sepia" />
          <span className="font-hand text-[12px] leading-none text-stamp-sepia">sin fronteras</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="regla-terracota" />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-terracotta">
            El atlas de las posibilidades
          </span>
        </div>

        <h1 className="mt-5 max-w-xl font-display text-5xl font-normal leading-[1.05] tracking-tight text-on-surface xl:text-6xl">
          Cada viaje,
          <br />
          <span className="italic text-terracotta">una historia.</span>
        </h1>

        <p className="mt-5 max-w-lg font-sans text-base leading-relaxed text-on-surface-variant">
          Hay lugares que nos cambian para siempre. Aquí empieza el arte de descubrirlos y de
          crear viajes que dejan huella.
        </p>
        <p className="mt-3 font-display text-lg italic text-stamp-sepia">
          Tantas rutas. Un mismo deseo de explorar.
        </p>
      </div>

      <LaminaMundo />
      <IndiceRutas />
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function LaminaMundo() {
  return (
    <figure className="relative max-w-2xl">
      <div className="mb-3 flex items-end justify-between">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-stamp-sepia">
          Lámina I
        </span>
        <span className="font-hand text-lg text-stamp-sepia">«El mundo conocido»</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-parchment-border bg-surface-container-low">
        <img
          src={fondoMundo}
          alt="Ilustración de monumentos del mundo: fortaleza andina, Coliseo romano, pirámide de Chichén Itzá, Taj Mahal y el Cristo Redentor"
          className="h-40 w-full object-cover object-bottom contrast-[1.02] sm:h-48 xl:h-56"
        />
        {/* El cielo de la ilustración se funde con el pergamino */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-surface via-surface/55 to-transparent"
        />
        <div aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>

      <figcaption className="mt-2 font-hand text-base leading-snug text-stamp-sepia">
        Trazada a mano: cinco continentes en una sola línea del horizonte.
      </figcaption>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */

function IndiceRutas() {
  return (
    <div className="max-w-2xl border-t border-parchment-border/80 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          Rutas seleccionadas
        </span>
        <span className="flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-terracotta">
          Un mundo por escribir
          <span className="h-px w-4 bg-terracotta" />
        </span>
      </div>

      <div className="relative">
        {/* Línea de ruta punteada: los destinos son paradas sobre el mapa */}
        <div
          aria-hidden
          className="absolute inset-x-1 top-[3px] border-t border-dashed border-terracotta/40"
        />
        <ul className="relative grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
          {DESTINOS.map((d) => (
            <li key={d.nombre} className="flex flex-col gap-1">
              <span className="h-2 w-2 rounded-full bg-terracotta ring-4 ring-surface" />
              <span className="mt-1 font-display text-lg leading-none text-on-surface">
                {d.nombre}
              </span>
              <span className="font-sans text-[10px] uppercase tracking-wider text-stamp-sepia">
                {d.coord}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function PortalAcceso() {
  return (
    <section className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:col-span-5 lg:px-12 xl:px-16">
      <div className="w-full max-w-md">
        {/* En móvil, la lámina asoma como banda superior */}
        <div className="relative mb-6 overflow-hidden rounded-xl border border-parchment-border lg:hidden">
          <img src={fondoMundo} alt="" className="h-28 w-full object-cover object-bottom" />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-surface to-transparent"
          />
        </div>

        <div className="relative rounded-2xl border border-parchment-border/80 bg-surface-bright/70 p-6 shadow-paper backdrop-blur-sm sm:p-8">
          <Outlet />
        </div>

        <div className="mt-5 flex items-start gap-3 border-t border-parchment-border/70 pt-4">
          <IconoEscudo className="mt-0.5 h-4 w-4 shrink-0 text-stamp-sepia" />
          <div>
            <p className="font-display text-xs italic text-on-surface">
              Tu tranquilidad también viaja contigo.
            </p>
            <p className="font-sans text-[11px] text-stamp-sepia">
              Conexión segura. Sus datos, siempre protegidos.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center font-hand text-lg text-stamp-sepia">
          su próxima historia comienza aquí →
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function PieAuth() {
  return (
    <footer className="relative z-10 flex flex-col items-center justify-between gap-2 border-t border-parchment-border/70 px-6 py-4 text-center md:flex-row lg:px-12">
      <p className="font-sans text-[11px] text-stamp-sepia">© 2026 Illimani Global Travel S.R.L.</p>
      <p className="font-display text-sm italic text-on-surface-variant">
        Hecho para quienes imaginan el próximo destino.
      </p>
      <div className="flex items-center gap-5 font-sans text-[11px] text-stamp-sepia">
        <a href="#privacidad" className="transition-colors hover:text-on-surface">
          Privacidad
        </a>
        <a href="#terminos" className="transition-colors hover:text-on-surface">
          Términos y condiciones
        </a>
      </div>
    </footer>
  )
}
