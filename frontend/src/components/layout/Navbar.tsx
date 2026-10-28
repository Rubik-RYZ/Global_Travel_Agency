import { Link, NavLink } from 'react-router-dom'

import { PerfilMenu } from '@/components/layout/PerfilMenu'
import { useAuthStore } from '@/store/authStore'

const enlaces = [
  { a: '/', texto: 'Inicio', fin: true },
  { a: '/destinos', texto: 'Destinos' },
  { a: '/viajes', texto: 'Viajes' },
]

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)

  return (
    <header className="sticky top-0 z-40 border-b border-parchment-border/60 bg-surface/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold text-primary">Illimani</span>
          <span className="etiqueta-seccion">Global Travel</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {enlaces.map((e) => (
            <li key={e.a}>
              <NavLink
                to={e.a}
                end={e.fin}
                className={({ isActive }) =>
                  `font-sans text-sm uppercase tracking-wider transition-colors ${
                    isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`
                }
              >
                {e.texto}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {usuario ? (
            <PerfilMenu />
          ) : (
            <>
              <Link
                to="/login"
                className="font-sans text-sm uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="rounded-full bg-terracotta px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}