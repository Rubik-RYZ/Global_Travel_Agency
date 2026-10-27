import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Modal } from '@/components/ui/Modal/Modal'
import { Select } from '@/components/ui/Select/Select'
import type { Rol, UsuarioEquipo } from '@/types/auth.types'
import { usuarioEquipoSchema, type UsuarioEquipoForm } from '@/types/auth.schemas'
import { mensajeDeError } from '@/utils/validators'

interface Props {
  abierto: boolean
  onCerrar: () => void
  roles: Rol[]
  usuario: UsuarioEquipo | null
  onGuardado: () => void
}

export function UsuarioFormModal({ abierto, onCerrar, roles, usuario, onGuardado }: Props) {
  const editando = usuario !== null

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioEquipoForm>({ resolver: zodResolver(usuarioEquipoSchema) })

  useEffect(() => {
    if (!abierto) return
    reset({
      email: usuario?.email ?? '',
      rol_id: usuario?.rol_id ?? 2,
      activo: usuario?.activo ?? true,
      password: '',
    })
  }, [abierto, usuario, reset])

  const onSubmit = async (datos: UsuarioEquipoForm) => {
    try {
      if (editando && usuario) {
        await authApi.actualizarUsuario(usuario.id, {
          rol_id: datos.rol_id,
          activo: datos.activo,
          password: datos.password || undefined,
        })
      } else {
        await authApi.crearUsuario({
          email: datos.email,
          rol_id: datos.rol_id,
          activo: datos.activo ?? true,
          password: datos.password,
        })
      }
      onGuardado()
      onCerrar()
    } catch (error) {
      setError('root', { message: mensajeDeError(error) })
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? 'Editar acceso' : 'Nuevo acceso al equipo'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="off"
          disabled={editando}
          error={errors.email?.message}
          {...register('email')}
        />
        <Select
          label="Rol"
          placeholder="Selecciona un rol"
          opciones={roles.map((r) => ({ valor: r.id, texto: r.nombre }))}
          error={errors.rol_id?.message}
          {...register('rol_id')}
        />
        <Input
          label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <label className="flex items-center gap-3 font-sans text-sm text-on-surface">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-outline-variant accent-terracotta"
            {...register('activo')}
          />
          Cuenta activa
        </label>

        {errors.root && (
          <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
            {errors.root.message}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear acceso'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}