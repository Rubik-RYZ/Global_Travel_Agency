import { Link, Outlet } from 'react-router-dom'

/**
 * Layout de acceso (login / registro / recuperación).
 *
 * Composición inspirada en la pantalla de Stitch
 * "Terranova: Pasaporte & Bitácora de Acceso" (control de pasajeros),
 * re-estilizada con los tokens locales de design.md.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* --- Panel del pasaporte (motivo de expedición) --- */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-forest-night px-12 py-14 text-on-secondary lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-terracotta/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
        />

        <Link to="/" className="relative flex flex-col leading-none">
          <span className="font-display text-2xl font-semibold">Illimani</span>
          <span className="etiqueta-seccion text-gold">Global Travel S.R.L.</span>
        </Link>

        {/* Pasaporte */}
        <div className="relative mx-auto w-full max-w-sm rotate-[-1.5deg] rounded-lg border border-gold/40 bg-secondary-container/70 p-7 shadow-paper-lg backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest2 text-gold">
                Agencia de Viajes Internacional
              </p>
              <p className="mt-1 font-sans text-xs uppercase tracking-wider text-on-secondary-container">
                Pasaporte de Expedicionario
              </p>
            </div>
            <span className="rotate-6 rounded-full border-2 border-gold/70 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-gold">
              Admitido
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <CampoPasaporte etiqueta="No. Expedición" valor="TN-08492" />
            <CampoPasaporte etiqueta="Región" valor="Andes & Oriente" />
            <CampoPasaporte etiqueta="Próxima salida" valor="Machu Picchu · Roma" />
          </div>

          <div className="mt-7 rounded-md bg-forest-night/70 px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.2em] text-on-secondary-container">
            <p>P&lt;ILLIMANI&lt;GLOBAL&lt;TRAVEL&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
            <p>TN08492&lt;8BOL9502147M&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</p>
          </div>
        </div>

        <p className="relative nota-manuscrita -rotate-2 text-gold">
          «El mundo te espera; nosotros abrimos la puerta.»
        </p>
      </aside>

      {/* --- Columna del formulario --- */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary lg:hidden"
          >
            ← Volver al inicio
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function CampoPasaporte({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="border-b border-gold/20 pb-2">
      <p className="font-sans text-[10px] uppercase tracking-widest2 text-gold/80">
        {etiqueta}
      </p>
      <p className="font-display text-lg text-on-secondary">{valor}</p>
    </div>
  )
}
