import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Monograma } from '@/components/shared/Monograma'
import { IconoChevron, IconoEdificio, IconoGlobo, IconoSalir } from '@/components/ui/Iconos'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { esPanel, etiquetaRol } from '@/utils/roles'

interface EnlaceMenu {
  a: string
  texto: string
  icono: ReactNode
}

/**
 * Credencial de sesión: muestra al usuario y despliega un menú con su rol,
 * el acceso a su área y el cierre de sesión. Animado con framer-motion y
 * cerrable con clic fuera o tecla Escape.
 */
export function PerfilMenu() {
  const usuario = useAuthStore((s) => s.usuario)
  const { cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

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

  if (!usuario) return null

  const panel = esPanel(usuario.rol)
  const enlaces: EnlaceMenu[] = [
    {
      a: panel ? '/admin' : '/mi-cuenta',
      texto: panel ? 'Panel de gestión' : 'Mi viaje',
      icono: <IconoEdificio className="h-4 w-4" />,
    },
    { a: '/', texto: 'Ver sitio público', icono: <IconoGlobo className="h-4 w-4" /> },
  ]

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="group inline-flex items-center gap-2.5 rounded-full border border-parchment-border bg-surface-container-low py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-terracotta/50"
      >
        <Monograma nombre={usuario.email} tamano="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[170px] truncate font-sans text-xs text-on-surface">
            {usuario.email}
          </span>
          <span className="coord">{etiquetaRol(usuario.rol)}</span>
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
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper-lg"
          >
            <div className="border-b border-parchment-border/70 bg-surface-container-low px-4 py-3">
              <p className="truncate font-display text-base leading-tight text-on-surface">
                {usuario.email}
              </p>
              <p className="coord mt-1">{etiquetaRol(usuario.rol)}</p>
            </div>

            <div className="p-1.5">
              {enlaces.map((e) => (
                <Link
                  key={e.a}
                  to={e.a}
                  role="menuitem"
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 font-sans text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                >
                  <span className="text-terracotta">{e.icono}</span>
                  {e.texto}
                </Link>
              ))}
            </div>

            <div className="border-t border-parchment-border/70 p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false)
                  void cerrarSesion()
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 font-sans text-sm text-error transition-colors hover:bg-error-container/40"
              >
                <IconoSalir className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
