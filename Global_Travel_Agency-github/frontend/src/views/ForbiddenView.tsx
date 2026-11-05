import { Link } from 'react-router-dom'

/** 5. Sin permiso → /403 */
export function ForbiddenView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="nota-manuscrita text-stamp-sepia">zona restringida</span>
      <h1 className="mt-4 font-display text-7xl text-primary">403</h1>
      <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-on-surface-variant">
        Su pasaporte no habilita esta sección. Si cree que es un error, contacte
        al administrador de la agencia.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
      >
        Volver al inicio
      </Link>
    </div>
  )
}