import { IconoPasaporte } from '@/components/ui/Iconos'
import { RegisterForm } from '@/views/auth/components/RegisterForm'

/** 2. Crear cuenta → /registro */
export function RegisterView() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-terracotta">
          <IconoPasaporte className="h-3.5 w-3.5" />
          Emisión de credencial
        </span>
        <span className="font-hand text-base text-stamp-sepia">N.º 002</span>
      </div>

      <header className="mt-5">
        <h1 className="font-display text-3xl font-normal leading-[1.15] text-on-surface sm:text-4xl">
          Comience su
          <br />
          cuaderno de bitácora.
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-on-surface-variant">
          Expedición inmediata, sin costo. Su periplo queda cifrado bajo protocolos de bóveda.
        </p>
      </header>

      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  )
}
