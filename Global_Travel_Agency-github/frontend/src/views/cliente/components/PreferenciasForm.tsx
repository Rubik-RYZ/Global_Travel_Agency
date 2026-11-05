import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { perfilApi } from '@/api/clientes'
import { Button } from '@/components/ui/Button/Button'
import { IconoMoneda, IconoSello } from '@/components/ui/Iconos'
import { Input } from '@/components/ui/Input/Input'
import { Select } from '@/components/ui/Select/Select'
import {
  preferenciasSchema,
  type PreferenciasForm as PreferenciasFormTipo,
} from '@/types/cliente.schemas'
import type { ClientePreferencia } from '@/types/clientes.types'
import { INTERESES, MONEDAS } from '@/utils/catalogos'
import { formatearMoneda } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'

interface Props {
  preferencias: ClientePreferencia
  onGuardado: () => void
}

/**
 * Cuerpo del capítulo «La brújula»: intereses, moneda y presupuesto.
 * Se dibuja sin tarjeta ni cabecera — el capítulo los aporta.
 */
export function PreferenciasForm({ preferencias, onGuardado }: Props) {
  const [ok, setOk] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PreferenciasFormTipo>({
    resolver: zodResolver(preferenciasSchema),
    defaultValues: { intereses: [] },
  })

  useEffect(() => {
    reset({
      presupuesto_max: preferencias.presupuesto_max ?? '',
      moneda: (preferencias.moneda as PreferenciasFormTipo['moneda']) ?? 'USD',
      intereses: preferencias.intereses ?? [],
    })
    setOk(false)
  }, [preferencias, reset])

  const seleccionados = watch('intereses') ?? []
  const moneda = watch('moneda') ?? 'USD'
  const presupuesto = watch('presupuesto_max')

  const alternar = (valor: string) => {
    const siguientes = seleccionados.includes(valor)
      ? seleccionados.filter((v) => v !== valor)
      : [...seleccionados, valor]
    setValue('intereses', siguientes, { shouldDirty: true })
  }

  const onSubmit = async (datos: PreferenciasFormTipo) => {
    setOk(false)
    try {
      await perfilApi.guardarPreferencias({
        presupuesto_max: datos.presupuesto_max ? datos.presupuesto_max : null,
        moneda: datos.moneda,
        intereses: datos.intereses,
      })
      onGuardado()
      setOk(true)
    } catch (error) {
      setError('root', { message: mensajeDeError(error) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-3">
        <p className="coord">Intereses · elija los que le representen</p>
        <div className="flex flex-wrap gap-2.5">
          {INTERESES.map((interes) => {
            const activo = seleccionados.includes(interes.valor)
            return (
              <button
                key={interes.valor}
                type="button"
                aria-pressed={activo}
                onClick={() => alternar(interes.valor)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-all ${
                  activo
                    ? 'border-terracotta bg-terracotta text-white shadow-paper'
                    : 'border-parchment-border bg-surface-container-low text-on-surface-variant hover:-translate-y-0.5 hover:border-terracotta/50 hover:text-primary'
                }`}
              >
                {activo && <IconoSello className="h-3.5 w-3.5" />}
                {interes.texto}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Presupuesto máximo por viaje"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="Ej. 2500"
          icono={<IconoMoneda className="h-4 w-4" />}
          error={errors.presupuesto_max?.message}
          {...register('presupuesto_max')}
        />
        <Select
          label="Moneda"
          opciones={MONEDAS}
          error={errors.moneda?.message}
          {...register('moneda')}
        />
      </div>

      {errors.root && (
        <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-parchment-border/70 pt-5">
        <span className="font-hand text-lg text-stamp-sepia">
          {ok
            ? 'Preferencias selladas ✓'
            : presupuesto
              ? `Su techo de viaje: ${formatearMoneda(presupuesto, moneda)}`
              : `${seleccionados.length} interés${seleccionados.length === 1 ? '' : 'es'} marcados`}
        </span>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sellando...' : 'Sellar preferencias'}
        </Button>
      </div>
    </form>
  )
}
