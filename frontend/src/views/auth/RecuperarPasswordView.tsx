import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { recuperarSchema, type RecuperarForm } from '@/types/auth.schemas'
import { mensajeDeError } from '@/utils/validators'

/** 3. Recuperar contraseña → /recuperar */
export function RecuperarPasswordView() {
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarForm>({ resolver: zodResolver(recuperarSchema) })

  const onSubmit = async (datos: RecuperarForm) => {
    setError(null)
    try {
      await authApi.recuperar(datos.email)
      setEnviado(true)
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  if (enviado) {
    return (
      <div className="text-center">
        <p className="nota-manuscrita text-stamp-sepia">carta al correo</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Revise su bandeja</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-on-surface-variant">
          Si el email está registrado, recibirá un enlace válido por 2 horas para
          restablecer su clave de bóveda.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
        >
          Volver al acceso
        </Link>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-8">
        <p className="etiqueta-seccion">Recuperación de credencial</p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-on-surface">
          ¿Olvidó su clave?
        </h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Indique su correo y le enviaremos un enlace para restablecerla.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="viajero@ejemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {error && (
          <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
            {error}
          </p>
        )}
        <Button type="submit" tamano="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
        </Button>
        <p className="text-center font-sans text-xs text-on-surface-variant">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Volver al acceso
          </Link>
        </p>
      </form>
    </div>
  )
}