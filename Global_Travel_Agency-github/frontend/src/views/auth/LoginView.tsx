import { IconoPuerta } from '@/components/ui/Iconos'
import { LoginForm } from '@/views/auth/components/LoginForm'

/** 1. Iniciar sesión → /login */
export function LoginView() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-terracotta">
          <IconoPuerta className="h-3.5 w-3.5" />
          Acceso profesional
        </span>
        <span className="font-hand text-base text-stamp-sepia">N.º 001</span>
      </div>

      <header className="mt-5">
        <h1 className="font-display text-3xl font-normal leading-[1.15] text-on-surface sm:text-4xl">
          Su próxima historia
          <br />
          empieza aquí.
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-on-surface-variant">
          Bienvenido de vuelta. Presente su credencial para continuar la expedición.
        </p>
      </header>

      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  )
}
