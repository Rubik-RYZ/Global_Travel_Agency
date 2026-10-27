import { RegisterForm } from '@/views/auth/components/RegisterForm'

/** 2. Crear cuenta → /registro */
export function RegisterView() {
  return (
    <div>
      <header className="mb-8">
        <p className="etiqueta-seccion">Registro de expedicionario</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-on-surface">
          Emita su pasaporte
        </h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Expedición inmediata, sin costo. Cifrado bajo protocolos de bóveda.
        </p>
      </header>
      <RegisterForm />
    </div>
  )
}
