import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { Footer } from '@/components/layout/Footer'
import { PerfilMenu } from '@/components/layout/PerfilMenu'
import {
  IconoChevron,
  IconoEdificio,
  IconoEscudo,
  IconoFlechaDerecha,
  IconoMaletin,
  IconoModulos,
  IconoPersona,
  IconoPortapapeles,
  IconoSello,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import { esAdmin } from '@/utils/roles'

interface Modulo {
  a: string
  titulo: string
  descripcion: string
  icono: ReactNode
  fin?: boolean
  soloAdmin?: boolean
  /** Ruta aún no implementada (CU3): se muestra deshabilitada. */
  proximo?: boolean
}

const MODULOS: Modulo[] = [
  {
    a: '/admin',
    titulo: 'Resumen',
    descripcion: 'Indicadores y estado general del sistema',
    icono: <IconoEdificio className="h-4 w-4" />,
    fin: true,
  },
  {
    a: '/admin/clientes',
    titulo: 'Viajeros',
    descripcion: 'Padrón de clientes, fichas y preferencias de viaje',
    icono: <IconoPersona className="h-4 w-4" />,
  },
  {
    a: '/admin/roles',
    titulo: 'Equipo y accesos',
    descripcion: 'Usuarios internos, roles y permisos',
    icono: <IconoEscudo className="h-4 w-4" />,
    soloAdmin: true,
  },
  {
    a: '/admin/auditoria',
    titulo: 'Bitácora de seguridad',
    descripcion: 'Registro de actividad y accesos al sistema',
    icono: <IconoPortapapeles className="h-4 w-4" />,
    soloAdmin: true,
  },
  {
    a: '/admin/destinos',
    titulo: 'Destinos',
    descripcion: 'Catálogo de destinos y paquetes turísticos',
    icono: <IconoUbicacion className="h-4 w-4" />,
  },
  {
    a: '/admin/proveedores',
    titulo: 'Proveedores',
    descripcion: 'Aerolíneas, hoteles y operadores asociados',
    icono: <IconoMaletin className="h-4 w-4" />,
    soloAdmin: true,
  },
]

function coincideRuta(pathname: string, m: Modulo): boolean {
  if (m.proximo) return false
  return m.fin ? pathname === m.a : pathname === m.a || pathname.startsWith(`${m.a}/`)
}

/* -------------------------------------------------------------------------- */
/* Selector de módulo (desplegable)                                           */
/* -------------------------------------------------------------------------- */

function SelectorModulos({ modulos, actual }: { modulos: Modulo[]; actual: Modulo }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => setAbierto(false), [pathname])

  useEffect(() => {
    if (!abierto) return
    const alClicFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClicFuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('mousedown', alClicFuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-2.5 rounded-full border border-parchment-border bg-surface-container-low py-1.5 pl-3 pr-2.5 transition-colors hover:border-terracotta/50"
      >
        <IconoModulos className="h-4 w-4 shrink-0 text-terracotta" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="coord block">Módulo</span>
          <span className="block font-sans text-sm leading-tight text-on-surface">
            {actual.titulo}
          </span>
        </span>
        <IconoChevron
          className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 z-50 mt-2 w-[min(92vw,32rem)] origin-top-left overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest p-2 shadow-paper-lg"
          >
            <p className="coord px-3 pb-2 pt-1.5">Ir a un módulo del panel</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {modulos.map((m) => {
                const activo = m.a === actual.a
                if (m.proximo) {
                  return (
                    <div
                      key={m.a}
                      aria-disabled
                      className="flex cursor-not-allowed items-start gap-3 rounded-md px-3 py-2.5 opacity-55"
                    >
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                        {m.icono}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-sans text-sm text-on-surface">
                          {m.titulo}
                          <span className="rounded-full border border-outline-variant px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Pronto
                          </span>
                        </span>
                        <span className="mt-0.5 block font-sans text-xs leading-snug text-on-surface-variant">
                          {m.descripcion}
                        </span>
                      </span>
                    </div>
                  )
                }
                return (
                  <Link
                    key={m.a}
                    to={m.a}
                    role="menuitem"
                    className={`flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
                      activo ? 'bg-terracotta/10' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        activo
                          ? 'bg-terracotta text-white'
                          : 'bg-surface-container text-terracotta'
                      }`}
                    >
                      {m.icono}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-sans text-sm ${
                          activo ? 'font-semibold text-primary' : 'text-on-surface'
                        }`}
                      >
                        {m.titulo}
                      </span>
                      <span className="mt-0.5 block font-sans text-xs leading-snug text-on-surface-variant">
                        {m.descripcion}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Marco del panel                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Panel interno (administrador y agente).
 *
 * Sustituye la clásica barra lateral por una **barra superior con un menú
 * desplegable de módulos**, que además muestra el módulo activo como migas de
 * pan. La credencial de sesión vive en `PerfilMenu`.
 */
export function AdminLayout() {
  const usuario = useAuthStore((s) => s.usuario)
  const { pathname } = useLocation()

  const visibles = MODULOS.filter((m) => !m.soloAdmin || esAdmin(usuario?.rol))
  const actual =
    [...visibles]
      .filter((m) => coincideRuta(pathname, m))
      .sort((a, b) => b.a.length - a.a.length)[0] ?? visibles[0]

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Franja de contexto */}
      <div className="bg-secondary text-on-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
          <span className="coord inline-flex items-center gap-2 text-gold">
            <IconoSello className="h-3.5 w-3.5" />
            Panel de gestión
          </span>
          <span className="coord hidden text-on-secondary-container sm:inline-flex">
            La Paz · Bolivia · 16°30′ S 68°09′ W
          </span>
        </div>
      </div>

      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-parchment-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/admin" className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold text-primary">Illimani</span>
            <span className="coord">Panel</span>
          </Link>

          <SelectorModulos modulos={visibles} actual={actual} />

          <PerfilMenu />
        </div>
      </header>

      {/* Migas de pan del módulo */}
      <div className="border-b border-parchment-border bg-surface-container-low">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-2.5">
          <span className="coord text-on-surface-variant">Panel de gestión</span>
          <IconoFlechaDerecha className="h-3 w-3 opacity-40" aria-hidden />
          <span className="coord text-primary">{actual.titulo}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
