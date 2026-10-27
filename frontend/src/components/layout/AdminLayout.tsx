import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

const secciones = [
  { a: '/admin', texto: 'Inicio', fin: true },
  { a: '/admin/roles', texto: 'Equipo y accesos', soloAdmin: true },
  { a: '/admin/auditoria', texto: 'Bitácora de seguridad', soloAdmin: true },
  { a: '/admin/clientes', texto: 'Viajeros' },
  { a: '/admin/destinos', texto: 'Destinos' },
  { a: '/admin/proveedores', texto: 'Proveedores' },
]

export function AdminLayout() {
  const usuario = useAuthStore((s) => s.usuario)
  const { cerrarSesion } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 flex-col border-r border-parchment-border bg-secondary p-6 text-on-secondary md:flex">
        <p className="font-display text-xl text-on-secondary">Illimani</p>
        <p className="etiqueta-seccion mb-8 text-gold">Panel</p>
        <nav className="flex flex-1 flex-col gap-1">
          {secciones
            .filter((s) => !s.soloAdmin || esAdmin)
            .map((s) => (
              <NavLink
                key={s.a}
                to={s.a}
                end={s.fin}
                className={({ isActive }) =>
                  `rounded-md px-4 py-2.5 font-sans text-sm transition-colors ${
                    isActive
                      ? 'bg-terracotta text-white'
                      : 'text-on-secondary-container hover:bg-secondary-container'
                  }`
                }
              >
                {s.texto}
              </NavLink>
            ))}
        </nav>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="mt-6 rounded-md border border-white/15 px-4 py-2.5 text-left font-sans text-xs uppercase tracking-wider text-on-secondary-container transition-colors hover:border-terracotta hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-parchment-border bg-surface-container-low px-6 py-4 md:px-10">
          <p className="font-sans text-xs uppercase tracking-wider text-on-surface-variant">
            Panel de administración
          </p>
          <p className="font-sans text-xs text-on-surface-variant">
            {usuario?.email}{' '}
            <span className="ml-2 rounded-full bg-terracotta/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {usuario?.rol}
            </span>
          </p>
        </header>
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}