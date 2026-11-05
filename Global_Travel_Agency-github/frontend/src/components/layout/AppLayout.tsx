import { NavLink, Outlet } from 'react-router-dom'

import { RosaVientos } from '@/components/brand/RosaVientos'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

const secciones = [
  { a: '/mi-cuenta', texto: 'Resumen', fin: true },
  { a: '/mi-cuenta/preferencias', texto: 'Perfil y preferencias' },
]

/**
 * Área privada del cliente autenticado («Mi viaje»).
 *
 * Sigue la pauta de la referencia Stitch «Mi viaje · Resumen y Bitácora»: la
 * navegación pública arriba y, debajo, una banda ligera con la sub-navegación
 * del cuaderno de bitácora (Resumen / Perfil y preferencias). Sin bloques
 * pesados: el contenido es el protagonista.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />

      <div className="border-b border-parchment-border bg-surface-container-low">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6">
          <span className="flex items-center gap-2 py-3">
            <RosaVientos className="h-5 w-5 text-terracotta" />
            <span className="etiqueta-seccion">Mi viaje · Cuaderno de bitácora</span>
          </span>

          <nav className="flex gap-6">
            {secciones.map((s) => (
              <NavLink
                key={s.a}
                to={s.a}
                end={s.fin}
                className={({ isActive }) =>
                  `-mb-px border-b-2 py-3 font-sans text-xs font-medium uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-terracotta text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`
                }
              >
                {s.texto}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
