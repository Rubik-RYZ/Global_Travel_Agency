import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { restablecerSchema, type RestablecerForm } from '@/types/auth.schemas'
import { mensajeDeError } from '@/utils/validators'

/** Restablecer contraseña → /restablecer?token=… (destino del email) */
export function RestablecerPasswordView() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RestablecerForm>({ resolver: zodResolver(restablecerSchema) })

  const onSubmit = async (datos: RestablecerForm) => {
    setError(null)
    try {
      await authApi.restablecer(token, datos.password)
      setListo(true)
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="nota-manuscrita text-stamp-sepia">enlace incompleto</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Falta el token</h1>
        <p className="mt-3 font-sans text-sm text-on-surface-variant">
          Abra el enlace que recibió por correo para continuar.
        </p>
        <Link to="/recuperar" className="mt-8 inline-block font-semibold text-primary hover:underline">
          Solicitar un enlace nuevo
        </Link>
      </div>
    )
  }

  if (listo) {
    return (
      <div className="text-center">
        <p className="nota-manuscrita text-stamp-sepia">clave renovada</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Contraseña actualizada</h1>
        <p className="mt-3 font-sans text-sm text-on-surface-variant">
          Ya puede iniciar sesión con su nueva clave de bóveda.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6">
        <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-terracotta">
          Nueva credencial
        </span>
        <h1 className="mt-4 font-display text-3xl font-normal leading-[1.15] text-on-surface">
          Restablecer clave
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-on-surface-variant">
          Elija una nueva clave de bóveda (mínimo 8 caracteres).
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register('confirmar')}
        />
        {error && (
          <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
            {error}
          </p>
        )}
        <Button type="submit" tamano="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Guardando…' : 'Guardar nueva contraseña'}
        </Button>
      </form>
    </div>
  )
}