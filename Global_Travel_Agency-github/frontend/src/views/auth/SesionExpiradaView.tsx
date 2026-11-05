import { Link } from 'react-router-dom'

/** 4. Sesión expirada → /sesion-expirada */
export function SesionExpiradaView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="nota-manuscrita text-stamp-sepia">credencial vencida</span>
      <h1 className="mt-4 font-display text-5xl text-primary">Sesión expirada</h1>
      <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-on-surface-variant">
        Por seguridad, su credencial de acceso dejó de ser válida. Vuelva a
        identificarse para continuar la expedición.
      </p>
      <Link
        to="/login"
        className="mt-8 rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
      >
        Volver a iniciar sesión
      </Link>
    </div>
  )
}