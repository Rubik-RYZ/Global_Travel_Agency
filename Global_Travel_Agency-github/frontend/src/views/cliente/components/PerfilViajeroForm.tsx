import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { perfilApi } from '@/api/clientes'
import { Button } from '@/components/ui/Button/Button'
import { IconoLapiz } from '@/components/ui/Iconos'
import { Input } from '@/components/ui/Input/Input'
import { Select } from '@/components/ui/Select/Select'
import { perfilSchema, type PerfilForm } from '@/types/cliente.schemas'
import type { PerfilViajero } from '@/types/clientes.types'
import { DOCUMENTOS } from '@/utils/catalogos'
import { mensajeDeError } from '@/utils/validators'

interface Props {
  perfil: PerfilViajero
  onGuardado: () => void
}

/**
 * Cuerpo del capítulo «El pasaporte»: datos personales del viajero.
 * Se dibuja sin tarjeta ni cabecera — el capítulo los aporta.
 */
export function PerfilViajeroForm({ perfil, onGuardado }: Props) {
  const [ok, setOk] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PerfilForm>({ resolver: zodResolver(perfilSchema) })

  useEffect(() => {
    reset({
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      documento_tipo: (perfil.documento_tipo as PerfilForm['documento_tipo']) ?? '',
      documento_numero: perfil.documento_numero ?? '',
      telefono: perfil.telefono ?? '',
      fecha_nacimiento: perfil.fecha_nacimiento ?? '',
      pais_origen: perfil.pais_origen ?? '',
    })
    setOk(false)
  }, [perfil, reset])

  const onSubmit = async (datos: PerfilForm) => {
    setOk(false)
    try {
      await perfilApi.actualizar({
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        documento_tipo: datos.documento_tipo || null,
        documento_numero: datos.documento_numero || null,
        telefono: datos.telefono || null,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        pais_origen: datos.pais_origen || null,
      })
      onGuardado()
      setOk(true)
    } catch (error) {
      setError('root', { message: mensajeDeError(error) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Nombres" error={errors.nombres?.message} {...register('nombres')} />
        <Input label="Apellidos" error={errors.apellidos?.message} {...register('apellidos')} />
        <Select
          label="Tipo de documento"
          placeholder="Sin especificar"
          opciones={DOCUMENTOS}
          error={errors.documento_tipo?.message}
          {...register('documento_tipo')}
        />
        <Input
          label="Número de documento"
          placeholder="Ej. 9876543"
          error={errors.documento_numero?.message}
          {...register('documento_numero')}
        />
        <Input
          label="Teléfono de contacto"
          placeholder="+591 700 00000"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <Input
          label="País de origen"
          placeholder="Ej. Bolivia"
          error={errors.pais_origen?.message}
          {...register('pais_origen')}
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          error={errors.fecha_nacimiento?.message}
          {...register('fecha_nacimiento')}
        />
      </div>

      {errors.root && (
        <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-parchment-border/70 pt-5">
        <span className="font-hand text-lg text-stamp-sepia">
          {ok ? 'Guardado: su ficha quedó al día ✓' : 'Actualice sus datos cuando lo necesite.'}
        </span>
        <Button type="submit" disabled={isSubmitting}>
          <IconoLapiz className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Actualizar ficha'}
        </Button>
      </div>
    </form>
  )
}
