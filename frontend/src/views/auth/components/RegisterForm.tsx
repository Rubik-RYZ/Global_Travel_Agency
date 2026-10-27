import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button/Button'
import { IconoCandado, IconoSobre } from '@/components/ui/Iconos'
import { Input } from '@/components/ui/Input/Input'
import { useAuth } from '@/hooks/useAuth'
import { registroSchema, type RegistroForm as RegistroFormType } from '@/types/auth.schemas'
import { mensajeDeError } from '@/utils/validators'

export function RegisterForm() {
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormType>({ resolver: zodResolver(registroSchema) })

  const onSubmit = async (datos: RegistroFormType) => {
    try {
      await registrar(datos)
      navigate('/', { replace: true })
    } catch (error) {
      setError('root', { message: mensajeDeError(error) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Nombres"
          autoComplete="given-name"
          placeholder="Elena"
          error={errors.nombres?.message}
          {...register('nombres')}
        />
        <Input
          label="Apellidos"
          autoComplete="family-name"
          placeholder="Rostova"
          error={errors.apellidos?.message}
          {...register('apellidos')}
        />
      </div>
      <Input
        icono={<IconoSobre />}
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="viajero@illimanitravel.bo"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        icono={<IconoCandado />}
        label="Clave confidencial"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      {errors.root && (
        <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" tamano="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Emitiendo…' : 'Crear mi cuenta'}
        <span aria-hidden>→</span>
      </Button>

      <p className="text-center font-sans text-xs text-on-surface-variant">
        ¿Ya tiene credencial?{' '}
        <Link to="/login" className="font-semibold text-terracotta hover:underline">
          Inicie sesión
        </Link>
      </p>
    </form>
  )
}
