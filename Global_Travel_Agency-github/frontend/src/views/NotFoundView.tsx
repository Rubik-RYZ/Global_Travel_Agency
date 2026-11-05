import { Link } from 'react-router-dom'

export function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="nota-manuscrita text-stamp-sepia">ruta extraviada</span>
      <h1 className="mt-4 font-display text-7xl text-primary">404</h1>
      <p className="mt-4 max-w-md font-sans text-on-surface-variant">
        No encontramos la página que buscas. Puede que el enlace haya cambiado o ya no exista.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
      >
        Volver al inicio →
      </Link>
    </div>
  )
}
