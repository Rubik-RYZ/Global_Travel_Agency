import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      <Link to="/" className="mb-8 flex flex-col items-center leading-none">
        <span className="font-display text-3xl font-semibold text-primary">Illimani</span>
        <span className="etiqueta-seccion">Global Travel</span>
      </Link>
      <div className="w-full max-w-md rounded-lg border border-parchment-border bg-surface-bright p-8 shadow-paper">
        <Outlet />
      </div>
    </div>
  )
}
