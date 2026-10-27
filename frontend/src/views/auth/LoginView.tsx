import { LoginForm } from '@/views/auth/components/LoginForm'

/** 1. Iniciar sesión → /login */
export function LoginView() {
  return (
    <div>
      <header className="mb-8">
        <p className="etiqueta-seccion">Control de pasajeros</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-on-surface">
          Bienvenido de vuelta
        </h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Presente su credencial para continuar su expedición.
        </p>
      </header>
      <LoginForm />
    </div>
  )
}
