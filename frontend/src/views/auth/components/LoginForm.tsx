import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginForm as LoginFormType } from '@/types/auth.schemas'
import { esPanel } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'

export function LoginForm() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (datos: LoginFormType) => {
    try {
      const usuario = await iniciarSesion(datos.email, datos.password)
      const estado = location.state as { desde?: string } | null
      const destino = estado?.desde ?? (esPanel(usuario.rol) ? '/admin' : '/')
      navigate(destino, { replace: true })
    } catch (error) {
      setError('root', { message: mensajeDeError(error) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="viajero@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Clave confidencial de bóveda"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      {errors.root && (
        <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Link
          to="/recuperar"
          className="font-sans text-xs uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
        >
          ¿Olvidó su clave?
        </Link>
      </div>

      <Button type="submit" tamano="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Validando…' : 'Validar credenciales y entrar'}
      </Button>

      <p className="text-center font-sans text-xs text-on-surface-variant">
        ¿Primera vez en la agencia?{' '}
        <Link to="/registro" className="font-semibold text-primary hover:underline">
          Solicitar nuevo pasaporte
        </Link>
      </p>
    </form>
  )
}
