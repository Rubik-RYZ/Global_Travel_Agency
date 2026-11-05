import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { clientesApi } from '@/api/clientes'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Modal } from '@/components/ui/Modal/Modal'
import { Select } from '@/components/ui/Select/Select'
import { SubidorImagen } from '@/components/ui/SubidorImagen/SubidorImagen'
import { perfilSchema, type PerfilForm } from '@/types/cliente.schemas'
import type { Cliente } from '@/types/clientes.types'
import { DOCUMENTOS } from '@/utils/catalogos'
import { mensajeDeError } from '@/utils/validators'

interface Props {
  abierto: boolean
  onCerrar: () => void
  cliente: Cliente | null
  onGuardado: () => void
}

/** Documento digitalizado (URL + identificador en el almacén). */
interface Documento {
  url: string
  publicId: string
}

const DOC_VACIO: Documento = { url: '', publicId: '' }

/** Alta/edición de un viajero desde el panel (puede no tener cuenta). */
export function ClienteFormModal({ abierto, onCerrar, cliente, onGuardado }: Props) {
  const editando = cliente !== null
  const [pasaporte, setPasaporte] = useState<Documento>(DOC_VACIO)
  const [carnet, setCarnet] = useState<Documento>(DOC_VACIO)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PerfilForm>({ resolver: zodResolver(perfilSchema) })

  useEffect(() => {
    if (!abierto) return
    reset({
      nombres: cliente?.nombres ?? '',
      apellidos: cliente?.apellidos ?? '',
      documento_tipo: (cliente?.documento_tipo as PerfilForm['documento_tipo']) ?? '',
      documento_numero: cliente?.documento_numero ?? '',
      telefono: cliente?.telefono ?? '',
      fecha_nacimiento: cliente?.fecha_nacimiento ?? '',
      pais_origen: cliente?.pais_origen ?? '',
    })
    setPasaporte({
      url: cliente?.pasaporte_url ?? '',
      publicId: cliente?.pasaporte_public_id ?? '',
    })
    setCarnet({
      url: cliente?.carnet_url ?? '',
      publicId: cliente?.carnet_public_id ?? '',
    })
  }, [abierto, cliente, reset])

  const onSubmit = async (datos: PerfilForm) => {
    const payload = {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      documento_tipo: datos.documento_tipo || null,
      documento_numero: datos.documento_numero || null,
      telefono: datos.telefono || null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
      pais_origen: datos.pais_origen || null,
      pasaporte_url: pasaporte.url || null,
      pasaporte_public_id: pasaporte.publicId || null,
      carnet_url: carnet.url || null,
      carnet_public_id: carnet.publicId || null,
    }
    try {
      if (editando && cliente) {
        await clientesApi.actualizar(cliente.id, payload)
      } else {
        await clientesApi.crear(payload)
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
      ancho="lg"
      titulo={editando ? 'Editar viajero' : 'Nuevo viajero'}
    >
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
            placeholder="Ej. A1234567"
            error={errors.documento_numero?.message}
            {...register('documento_numero')}
          />
          <Input
            label="Teléfono"
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

        <div className="flex flex-col gap-4 rounded-md bg-surface-container-low p-4">
          <div>
            <span className="coord text-secondary">Documentos de viaje digitalizados</span>
            <p className="mt-1 font-sans text-[11px] leading-relaxed text-on-surface-variant">
              Se alojan en el almacén del proyecto y quedan enlazados a la ficha del
              viajero. Son opcionales.
            </p>
          </div>
          <SubidorImagen
            valor={pasaporte.url}
            publicId={pasaporte.publicId || null}
            onChange={(url, publicId) => setPasaporte({ url, publicId: publicId ?? '' })}
            carpeta="pasaportes"
            forma="documento"
            etiqueta="Pasaporte"
          />
          <SubidorImagen
            valor={carnet.url}
            publicId={carnet.publicId || null}
            onChange={(url, publicId) => setCarnet({ url, publicId: publicId ?? '' })}
            carpeta="carnets"
            forma="documento"
            etiqueta="Carnet de identidad"
          />
        </div>

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
            {isSubmitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar viajero'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
