import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  catalogoApi,
  type FiltrosSalida,
  type Paquete,
  type PaqueteSalida,
  type Vuelo,
} from '@/api/catalogo'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoBasura,
  IconoBillete,
  IconoCalendario,
  IconoLapiz,
  IconoLupa,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

function fechaLarga(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fechaVuelo(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 26. Panel · Calendario de salidas → /admin/salidas */
export function SalidasAdminView() {
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [vuelos, setVuelos] = useState<Vuelo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [paqueteFiltro, setPaqueteFiltro] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosSalida>({})

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<PaqueteSalida | null>(null)

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [paqs, vlos] = await Promise.all([
          (async () => {
            const acc: Paquete[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarPaquetes({ page: pagina })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
          (async () => {
            const acc: Vuelo[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarVuelos({ page: pagina })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
        ])
        if (activo) {
          setPaquetes(paqs)
          setVuelos(vlos)
        }
      } catch (e) {
        if (activo) setError(mensajeDeError(e))
      }
    }
    void cargarCatalogos()
    return () => {
      activo = false
    }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const acc: PaqueteSalida[] = []
      let pagina = 1
      for (;;) {
        const data = await catalogoApi.listarSalidas({ ...filtros, page: pagina })
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setSalidas(acc)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [filtros])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const resumen = useMemo(
    () => ({
      total: salidas.length,
      conCupos: salidas.filter((s) => s.cupos_disponibles > 0).length,
      cupos: salidas.reduce((suma, s) => suma + s.cupos_disponibles, 0),
    }),
    [salidas],
  )

  function aplicarFiltros(evento?: FormEvent) {
    evento?.preventDefault()
    setFiltros({
      paquete: paqueteFiltro ? Number(paqueteFiltro) : undefined,
      disponibles: soloDisponibles || undefined,
    })
  }

  async function eliminar(salida: PaqueteSalida) {
    if (
      !window.confirm(
        `¿Eliminar la salida del ${fechaLarga(salida.fecha_salida)}?`,
      )
    )
      return
    try {
      await catalogoApi.eliminarSalida(salida.id)
      setAviso('Salida eliminada del calendario.')
      void cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-high px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            <span className="coord">Calendario de salidas · CU6 · RF-11</span>
          </div>
          <div className="flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Fechas y cupos de la casa</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="coord flex items-center gap-2 text-terracotta">
              <span className="regla-terracotta" />
              Calendario operativo
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
              Salidas &amp; cupos del catálogo
            </h1>
            <p className="font-display text-lg font-normal italic text-on-surface-variant">
              Fechas confirmadas de cada paquete, con sus vuelos de ida y vuelta
              y la disponibilidad vigente.
            </p>
          </div>

          <Button
            className="group shrink-0"
            onClick={() => {
              setEditando(null)
              setModalAbierto(true)
            }}
          >
            <IconoCalendario className="h-4 w-4" />
            Programar salida
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-parchment-border py-3">
          <span className="coord">
            Salidas <strong className="ml-1 text-primary">{resumen.total}</strong>
          </span>
          <span className="coord">
            Con cupos <strong className="ml-1 text-primary">{resumen.conCupos}</strong>
          </span>
          <span className="coord">
            Cupos libres <strong className="ml-1 text-primary">{resumen.cupos}</strong>
          </span>
        </div>
      </header>

      <section className="mt-8 flex flex-col gap-4 rounded-lg bg-surface-container-low p-6 shadow-paper sm:p-8">
        <form
          onSubmit={aplicarFiltros}
          className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
        >
          <label className="flex flex-col gap-1.5">
            <span className="coord">Paquete</span>
            <select
              value={paqueteFiltro}
              onChange={(e) => setPaqueteFiltro(e.target.value)}
              className="min-w-56 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Todos los paquetes</option>
              {paquetes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-forest-night px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-surface transition-colors hover:bg-ink-warm"
          >
            <IconoLupa className="h-4 w-4" />
            Filtrar
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={soloDisponibles}
            onClick={() => {
              const siguiente = !soloDisponibles
              setSoloDisponibles(siguiente)
              setFiltros((f) => ({ ...f, disponibles: siguiente || undefined }))
            }}
            className={`rounded-full px-3.5 py-1.5 font-sans text-xs transition-colors ${
              soloDisponibles
                ? 'bg-surface-container-high font-medium text-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Solo con cupos disponibles
          </button>
          <span className="coord">
            Mostrando <strong className="text-primary">{salidas.length}</strong> salidas
          </span>
        </div>
      </section>

      {error && (
        <p className="mt-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mt-6 rounded-md border border-secondary/30 bg-secondary/5 px-4 py-2.5 font-sans text-xs text-secondary">
          {aviso}
        </p>
      )}

      <section className="mt-8">
        {cargando ? (
          <p className="nota-manuscrita">Abriendo el calendario de salidas...</p>
        ) : salidas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">
              Sin salidas programadas
            </p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Programe una fecha o ajuste los filtros del calendario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full min-w-4xl border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="coord px-5 py-3 font-normal">Fecha</th>
                  <th className="coord px-5 py-3 font-normal">Paquete</th>
                  <th className="coord hidden px-5 py-3 font-normal lg:table-cell">
                    Vuelos
                  </th>
                  <th className="coord px-5 py-3 font-normal">Cupos</th>
                  <th className="coord px-5 py-3 font-normal">Estado</th>
                  <th className="coord px-5 py-3 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salidas.map((salida) => (
                  <tr
                    key={salida.id}
                    className="border-b border-parchment-border/60 last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-display text-lg capitalize text-on-surface">
                        {fechaLarga(salida.fecha_salida)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm text-on-surface-variant">
                      {salida.paquete_nombre}
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant lg:table-cell">
                      {salida.vuelo_ida_numero ? (
                        <span className="inline-flex items-center gap-1.5">
                          <IconoBillete className="h-3.5 w-3.5 text-terracotta" />
                          {salida.vuelo_ida_numero}
                          {salida.vuelo_vuelta_numero
                            ? ` · ${salida.vuelo_vuelta_numero}`
                            : ''}
                        </span>
                      ) : (
                        'Vuelos por asignar'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm text-on-surface">
                      {salida.cupos_disponibles} / {salida.cupos_totales}
                    </td>
                    <td className="px-5 py-3.5">
                      {salida.cupos_disponibles > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 coord text-on-surface-variant">
                          <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
                          Agotada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(salida)
                            setModalAbierto(true)
                          }}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
                        >
                          <IconoLapiz className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminar(salida)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia hover:text-error"
                        >
                          <IconoBasura className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SalidaFormModal
        abierto={modalAbierto}
        salida={editando}
        paquetes={paquetes}
        vuelos={vuelos}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={(mensaje) => {
          setAviso(mensaje)
          void cargar()
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Formulario de alta / edición                                               */
/* -------------------------------------------------------------------------- */

interface FormSalida {
  paquete: string
  fecha_salida: string
  vuelo_ida: string
  vuelo_vuelta: string
  cupos_totales: string
  cupos_disponibles: string
}

const FORM_VACIO: FormSalida = {
  paquete: '',
  fecha_salida: '',
  vuelo_ida: '',
  vuelo_vuelta: '',
  cupos_totales: '',
  cupos_disponibles: '',
}

function SalidaFormModal({
  abierto,
  salida,
  paquetes,
  vuelos,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean
  salida: PaqueteSalida | null
  paquetes: Paquete[]
  vuelos: Vuelo[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}) {
  const [form, setForm] = useState<FormSalida>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setForm(
      salida
        ? {
            paquete: String(salida.paquete),
            fecha_salida: salida.fecha_salida,
            vuelo_ida: salida.vuelo_ida ? String(salida.vuelo_ida) : '',
            vuelo_vuelta: salida.vuelo_vuelta ? String(salida.vuelo_vuelta) : '',
            cupos_totales: String(salida.cupos_totales),
            cupos_disponibles: String(salida.cupos_disponibles),
          }
        : FORM_VACIO,
    )
  }, [abierto, salida])

  function campo<K extends keyof FormSalida>(clave: K, valor: FormSalida[K]) {
    setForm((f) => ({ ...f, [clave]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form.paquete || !form.fecha_salida || !form.cupos_totales) {
      setError('Complete paquete, fecha de salida y cupos totales.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const payload = {
        paquete: Number(form.paquete),
        fecha_salida: form.fecha_salida,
        vuelo_ida: form.vuelo_ida ? Number(form.vuelo_ida) : null,
        vuelo_vuelta: form.vuelo_vuelta ? Number(form.vuelo_vuelta) : null,
        cupos_totales: Number(form.cupos_totales),
        cupos_disponibles: form.cupos_disponibles
          ? Number(form.cupos_disponibles)
          : undefined,
      }
      if (salida) {
        await catalogoApi.actualizarSalida(salida.id, payload)
        onGuardado('Salida actualizada en el calendario.')
      } else {
        await catalogoApi.crearSalida(payload)
        onGuardado('Salida programada en el calendario.')
      }
      onCerrar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const claseCampo =
    'w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary'

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      titulo={salida ? 'Editar salida' : 'Programar nueva salida'}
    >
      <p className="coord mb-4 text-primary">
        {salida
          ? `${salida.paquete_nombre} · ${fechaLarga(salida.fecha_salida)}`
          : 'Nueva fecha · Calendario de salidas'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Paquete *</span>
            <select
              value={form.paquete}
              onChange={(e) => campo('paquete', e.target.value)}
              className={claseCampo}
            >
              <option value="">Seleccione un paquete</option>
              {paquetes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.destino_nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Fecha de salida *</span>
            <input
              type="date"
              value={form.fecha_salida}
              onChange={(e) => campo('fecha_salida', e.target.value)}
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Cupos totales *</span>
            <input
              type="number"
              min="0"
              value={form.cupos_totales}
              onChange={(e) => campo('cupos_totales', e.target.value)}
              placeholder="20"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Vuelo de ida</span>
            <select
              value={form.vuelo_ida}
              onChange={(e) => campo('vuelo_ida', e.target.value)}
              className={claseCampo}
            >
              <option value="">Sin asignar</option>
              {vuelos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.numero_vuelo} · {v.origen}→{v.destino} ·{' '}
                  {fechaVuelo(v.salida)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Vuelo de vuelta</span>
            <select
              value={form.vuelo_vuelta}
              onChange={(e) => campo('vuelo_vuelta', e.target.value)}
              className={claseCampo}
            >
              <option value="">Sin asignar</option>
              {vuelos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.numero_vuelo} · {v.origen}→{v.destino} ·{' '}
                  {fechaVuelo(v.salida)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Cupos disponibles</span>
            <input
              type="number"
              min="0"
              value={form.cupos_disponibles}
              onChange={(e) => campo('cupos_disponibles', e.target.value)}
              placeholder="Igual al total si se deja vacío"
              className={claseCampo}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-md border border-error/40 bg-error-container/50 px-3.5 py-2.5 font-sans text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variante="ghost" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : salida ? 'Guardar cambios' : 'Programar salida'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}