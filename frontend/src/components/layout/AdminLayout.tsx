import { NavLink, Outlet } from 'react-router-dom'

const secciones = [
  { a: '/admin', texto: 'Inicio', fin: true },
  { a: '/admin/roles', texto: 'Equipo y accesos' },
  { a: '/admin/auditoria', texto: 'Bitácora de seguridad' },
  { a: '/admin/clientes', texto: 'Viajeros' },
  { a: '/admin/destinos', texto: 'Destinos' },
  { a: '/admin/proveedores', texto: 'Proveedores' },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 flex-col border-r border-parchment-border bg-secondary p-6 text-on-secondary md:flex">
        <p className="mb-8 font-display text-xl text-on-secondary">Panel</p>
        <nav className="flex flex-col gap-1">
          {secciones.map((s) => (
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
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
