import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { MenuCuaderno } from '@/components/layout/MenuCuaderno'
import { PerfilMenu } from '@/components/layout/PerfilMenu'
import {
  IconoChevron,
  IconoCerrar,
  IconoFlechaDerecha,
  IconoGlobo,
  IconoLupa,
  IconoMenu,
} from '@/components/ui/Iconos'
import { CARACTERES, ORDEN_REGIONES } from '@/hooks/useCuadernoDestinos'
import { useAuthStore } from '@/store/authStore'

interface EnlaceNav {
  a: string
  texto: string
  /** Marca el enlace como activo sólo en coincidencia exacta (rutas raíz). */
  fin?: boolean
  /** Ancla a una sección de la home: nunca se resalta como «activo». */
  ancla?: boolean
}

/** Enlaces permanentes de la barra. Los que apuntan a la home usan hash. */
const ENLACES: EnlaceNav[] = [
  { a: '/destinos', texto: 'Expediciones' },
  { a: '/#itinerarios', texto: 'Itinerarios de autor', ancla: true },
  { a: '/#manifiesto', texto: 'Manifiesto', ancla: true },
]

type Panel = 'cuaderno' | 'buscar' | null

/**
 * Cabecera pública.
 *
 * `fixed`: sobre la home flota transparente encima del hero (texto marfil) y
 * se vuelve sólida al hacer scroll o al abrir un panel; en el resto de rutas
 * nace sólida. Aloja el mega-menú «Cuaderno de Destinos» (#13), un buscador
 * de catálogo y el menú de sesión.
 */
export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)

  const [panel, setPanel] = useState<Panel>(null)
  const [drawer, setDrawer] = useState(false)
  const [desplazado, setDesplazado] = useState(false)
  const [consulta, setConsulta] = useState('')

  const esHome = pathname === '/'
  const transparente = esHome && !desplazado && !panel && !drawer

  // Sólida en cuanto el hero queda atrás.
  useEffect(() => {
    const alScroll = () => setDesplazado(window.scrollY > 24)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  // Cerrar al cambiar de ruta.
  useEffect(() => {
    setPanel(null)
    setDrawer(false)
    setConsulta('')
  }, [pathname])

  // Escape cierra cualquier capa; bloquea el scroll con el drawer abierto.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel(null)
        setDrawer(false)
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  const abrirCuaderno = () =>
    setPanel((p) => (p === 'cuaderno' ? null : 'cuaderno'))
  const abrirBuscar = () => setPanel((p) => (p === 'buscar' ? null : 'buscar'))

  const enviarBusqueda = (e: React.FormEvent) => {
    e.preventDefault()
    const q = consulta.trim()
    setPanel(null)
    setDrawer(false)
    setConsulta('')
    navigate(q ? `/destinos?q=${encodeURIComponent(q)}` : '/destinos')
  }

  return (
    <header
      ref={navRef}
      onMouseLeave={() => setPanel((p) => (p === 'cuaderno' ? null : p))}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        transparente
          ? 'bg-transparent'
          : 'border-b border-parchment-border/60 bg-surface/85 shadow-paper backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <nav className="relative flex items-center justify-between gap-4 py-4">
          {/* ── Marca ─────────────────────────────────────────────────────── */}
          <Link to="/" className="group flex items-center gap-3.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                transparente
                  ? 'border-gold/40 bg-white/5 text-gold'
                  : 'border-terracotta/30 bg-terracotta/10 text-primary'
              }`}
            >
              <IconoGlobo className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
            </span>
            <span className="flex flex-col leading-none">
              <span
                className={`font-display text-lg tracking-[0.25em] uppercase transition-colors md:text-xl ${
                  transparente ? 'text-white' : 'text-primary'
                }`}
              >
                Illimani
              </span>
              <span
                className={`mt-0.5 text-[9px] uppercase tracking-[0.28em] transition-colors ${
                  transparente ? 'text-gold/75' : 'text-stamp-sepia'
                }`}
              >
                Expediciones de autor · La Paz
              </span>
            </span>
          </Link>

          {/* ── Navegación principal ──────────────────────────────────────── */}
          <div
            className={`hidden items-center gap-8 text-[13px] font-medium tracking-wide md:flex ${
              transparente ? 'text-white/90' : 'text-on-surface-variant'
            }`}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={panel === 'cuaderno'}
              onMouseEnter={() => setPanel('cuaderno')}
              onClick={abrirCuaderno}
              className={`flex items-center gap-1.5 transition-colors ${
                transparente ? 'text-white/95 hover:text-gold' : 'hover:text-primary'
              } ${panel === 'cuaderno' ? (transparente ? 'text-gold' : 'text-primary') : ''}`}
            >
              Cuaderno de Destinos
              <IconoChevron
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  panel === 'cuaderno' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {ENLACES.map((e) =>
              e.ancla ? (
                <Link
                  key={e.a}
                  to={e.a}
                  onClick={() => setPanel(null)}
                  className={`transition-colors hover:text-primary ${
                    transparente ? 'hover:text-gold' : ''
                  }`}
                >
                  {e.texto}
                </Link>
              ) : (
                <NavLink
                  key={e.a}
                  to={e.a}
                  end={e.fin}
                  onClick={() => setPanel(null)}
                  className={({ isActive }) =>
                    `transition-colors hover:text-primary ${
                      transparente ? 'hover:text-gold' : ''
                    } ${isActive ? (transparente ? 'text-gold' : 'text-primary') : ''}`
                  }
                >
                  {e.texto}
                </NavLink>
              ),
            )}
          </div>

          {/* ── Acciones ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Buscar una expedición"
              aria-expanded={panel === 'buscar'}
              onClick={abrirBuscar}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                transparente
                  ? 'border-white/20 bg-white/5 text-white/80 hover:text-gold'
                  : 'border-parchment-border bg-surface-container-low text-on-surface-variant hover:border-terracotta/50 hover:text-primary'
              } ${panel === 'buscar' ? (transparente ? 'text-gold' : 'text-primary') : ''}`}
            >
              {panel === 'buscar' ? (
                <IconoCerrar className="h-4 w-4" />
              ) : (
                <IconoLupa className="h-4 w-4" />
              )}
            </button>

            {usuario ? (
              <PerfilMenu />
            ) : (
              <Link
                to="/login"
                className={`hidden items-center gap-2.5 rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] backdrop-blur-sm transition-all sm:inline-flex ${
                  transparente
                    ? 'border-gold/50 bg-surface/10 text-white hover:bg-surface/20'
                    : 'border-terracotta/40 bg-terracotta/5 text-primary hover:bg-terracotta/10'
                }`}
              >
                Mi cuaderno de viaje
                <IconoFlechaDerecha className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={drawer}
              onClick={() => setDrawer((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors md:hidden ${
                transparente
                  ? 'border-white/20 bg-white/5 text-white'
                  : 'border-parchment-border bg-surface-container-low text-on-surface'
              }`}
            >
              {drawer ? <IconoCerrar className="h-5 w-5" /> : <IconoMenu className="h-5 w-5" />}
            </button>
          </div>

          {/* ── Panel «Cuaderno de Destinos» (#13) ────────────────────────── */}
          <AnimatePresence>
            {panel === 'cuaderno' && (
              <motion.div
                key="cuaderno"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-x-0 top-full z-50 hidden pt-3 md:block"
              >
                <MenuCuaderno onNavegar={() => setPanel(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Panel de búsqueda ─────────────────────────────────────────── */}
          <AnimatePresence>
            {panel === 'buscar' && (
              <motion.div
                key="buscar"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-x-0 top-full z-50 pt-3"
              >
                <div className="rounded-xl border border-parchment-border/70 bg-surface/95 p-4 shadow-paper-lg backdrop-blur-2xl lg:p-5">
                  <form onSubmit={enviarBusqueda} className="flex items-center gap-3">
                    <IconoLupa className="h-5 w-5 shrink-0 text-primary" />
                    <input
                      autoFocus
                      value={consulta}
                      onChange={(e) => setConsulta(e.target.value)}
                      placeholder="Buscar por destino, país o experiencia…"
                      className="w-full bg-transparent font-sans text-base text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-on-primary transition-colors hover:bg-primary-container"
                    >
                      Buscar
                    </button>
                  </form>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-container-high pt-3">
                    <span className="coord mr-1">Búsquedas frecuentes</span>
                    {CARACTERES.slice(0, 4).map((c) => (
                      <Link
                        key={c.clave}
                        to={`/destinos?caracter=${c.clave}`}
                        onClick={() => setPanel(null)}
                        className="rounded-full border border-parchment-border px-3 py-1 font-sans text-xs text-on-surface-variant transition-colors hover:border-terracotta/50 hover:text-primary"
                      >
                        {c.nombre}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>

      {/* ── Cajón móvil ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 bottom-0 z-40 overflow-y-auto border-t border-parchment-border bg-surface px-5 pb-10 pt-[80px] md:hidden"
          >
            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setDrawer(false)}
                className="flex items-center justify-between border-b border-surface-container-high py-3 font-display text-xl text-on-surface"
              >
                Inicio
              </Link>
              {ENLACES.map((e) => (
                <Link
                  key={e.a}
                  to={e.a}
                  onClick={() => setDrawer(false)}
                  className="flex items-center justify-between border-b border-surface-container-high py-3 font-display text-xl text-on-surface"
                >
                  {e.texto}
                </Link>
              ))}
            </nav>

            <div className="mt-5">
              <span className="etiqueta-seccion text-primary">Cuaderno de Destinos</span>
              <div className="mt-3">
                <MenuCuaderno onNavegar={() => setDrawer(false)} />
              </div>
            </div>

            <div className="mt-5">
              <span className="etiqueta-seccion">Por región</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ORDEN_REGIONES.map((r) => (
                  <Link
                    key={r}
                    to={`/destinos?region=${r}`}
                    onClick={() => setDrawer(false)}
                    className="rounded-full border border-parchment-border px-3 py-1 font-sans text-xs capitalize text-on-surface-variant"
                  >
                    {r.replace(/_/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>

            {!usuario && (
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/registro"
                  onClick={() => setDrawer(false)}
                  className="rounded-full bg-terracotta px-5 py-3 text-center font-sans text-xs font-medium uppercase tracking-[0.15em] text-white"
                >
                  Crear cuenta
                </Link>
                <Link
                  to="/login"
                  onClick={() => setDrawer(false)}
                  className="rounded-full border border-parchment-border px-5 py-3 text-center font-sans text-xs font-medium uppercase tracking-[0.15em] text-on-surface-variant"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
