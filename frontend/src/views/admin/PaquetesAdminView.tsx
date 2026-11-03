import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  catalogoApi,
  type DestinoResumen,
  type FiltrosPaquete,
  type Hotel,
  type Paquete,
} from '@/api/catalogo'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoBasura,
  IconoEdificio,
  IconoLapiz,
  IconoLibro,
  IconoLupa,
  IconoMapa,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

const MONEDAS = ['USD', 'BOB', 'EUR']

function dinero(valor: string, moneda: string): string {
  const n = Number(valor)
  if (Number.isNaN(n)) return `${moneda} —`
  return `${moneda} ${n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** 25. Panel · Armador de paquetes → /admin/paquetes */
export function PaquetesAdminView() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [destinoFiltro, setDestinoFiltro] = useState('')
  const [filtros, setFiltros] = useState<FiltrosPaquete>({})

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Paquete | null>(null)

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [dests, hotels] = await Promise.all([
          (async () => {
            const acc: DestinoResumen[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarDestinos({ page: pagina })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
          (async () => {
            const acc: Hotel[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarHoteles({ page: pagina })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
        ])
        if (activo) {
          setDestinos(dests)
          setHoteles(hotels)
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
      const acc: Paquete[] = []
      let pagina = 1
      for (;;) {
        const data = await catalogoApi.listarPaquetes({ ...filtros, page: pagina })
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setPaquetes(acc)
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
      total: paquetes.length,
      activos: paquetes.filter((p) => p.activo).length,
      conSalidas: paquetes.filter((p) => p.salidas.length > 0).length,
    }),
    [paquetes],
  )

  function aplicarFiltros(evento?: FormEvent) {
    evento?.preventDefault()
    setFiltros({
      q: busqueda.trim() || undefined,
      destino: destinoFiltro ? Number(destinoFiltro) : undefined,
    })
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  async function alternarActivo(paquete: Paquete) {
    try {
      const actualizado = await catalogoApi.toggleActivoPaquete(paquete.id)
      setPaquetes((lista) =>
        lista.map((p) => (p.id === actualizado.id ? actualizado : p)),
      )
      setAviso(
        actualizado.activo
          ? 'Paquete publicado en el catálogo.'
          : 'Paquete retirado del catálogo.',
      )
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  async function eliminar(paquete: Paquete) {
    if (!window.confirm(`¿Eliminar el paquete ${paquete.nombre}?`)) return
    try {
      await catalogoApi.eliminarPaquete(paquete.id)
      setAviso('Paquete eliminado del armador.')
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
            <span className="coord">Armador de viajes · CU6 · RF-11</span>
          </div>
          <div className="flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Ofertas curadas por el atelier</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="coord flex items-center gap-2 text-terracotta">
              <span className="regla-terracotta" />
              Mesa de composición de viajes
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
              Armador de paquetes
            </h1>
            <p className="font-display text-lg font-normal italic text-on-surface-variant">
              Combine destino, hospedaje, duración y precio base para publicar
              ofertas en el cuaderno de viajes.
            </p>
          </div>

          <Button className="group shrink-0" onClick={abrirNuevo}>
            <IconoLibro className="h-4 w-4" />
            Armar paquete
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-parchment-border py-3">
          <span className="coord">
            Paquetes <strong className="ml-1 text-primary">{resumen.total}</strong>
          </span>
          <span className="coord">
            Publicados <strong className="ml-1 text-primary">{resumen.activos}</strong>
          </span>
          <span className="coord">
            Con salidas <strong className="ml-1 text-primary">{resumen.conSalidas}</strong>
          </span>
        </div>
      </header>

      <section className="mt-8 flex flex-col gap-4 rounded-lg bg-surface-container-low p-6 shadow-paper sm:p-8">
        <form
          onSubmit={aplicarFiltros}
          className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
        >
          <label className="flex w-full flex-col gap-1.5 lg:w-2/5">
            <span className="coord">Búsqueda de paquete</span>
            <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5">
              <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, destino o descripción..."
                className="w-full bg-transparent font-sans text-sm text-ink-warm outline-none placeholder:text-stamp-sepia/60"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Destino</span>
            <select
              value={destinoFiltro}
              onChange={(e) => setDestinoFiltro(e.target.value)}
              className="min-w-44 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Todos</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
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
          <span className="coord">
            Mostrando <strong className="text-primary">{paquetes.length}</strong>{' '}
            paquetes
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
          <p className="nota-manuscrita">Abriendo el armador de paquetes...</p>
        ) : paquetes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">
              Sin paquetes que mostrar
            </p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Arme una oferta o ajuste la búsqueda para ver paquetes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full min-w-4xl border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="coord px-5 py-3 font-normal">Paquete</th>
                  <th className="coord hidden px-5 py-3 font-normal sm:table-cell">
                    Destino
                  </th>
                  <th className="coord hidden px-5 py-3 font-normal lg:table-cell">
                    Hospedaje
                  </th>
                  <th className="coord px-5 py-3 font-normal">Duración</th>
                  <th className="coord px-5 py-3 font-normal">Precio base</th>
                  <th className="coord px-5 py-3 font-normal">Salidas</th>
                  <th className="coord px-5 py-3 font-normal">Estado</th>
                  <th className="coord px-5 py-3 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paquetes.map((paquete) => (
                  <tr
                    key={paquete.id}
                    className="border-b border-parchment-border/60 last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-display text-lg text-on-surface">
                        {paquete.nombre}
                      </span>
                      <span className="coord mt-0.5 block">
                        {paquete.etiquetas.join(' · ') || 'Sin etiquetas'}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant sm:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <IconoMapa className="h-3.5 w-3.5 text-terracotta" />
                        {paquete.destino_nombre}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant lg:table-cell">
                      {paquete.hotel_nombre ? (
                        <span className="inline-flex items-center gap-1.5">
                          <IconoEdificio className="h-3.5 w-3.5 text-terracotta" />
                          {paquete.hotel_nombre}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm text-on-surface">
                      {paquete.duracion_dias} días
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm font-medium text-on-surface">
                      {dinero(paquete.precio_base, paquete.moneda)}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm text-on-surface">
                      {paquete.salidas.length}
                    </td>
                    <td className="px-5 py-3.5">
                      {paquete.activo ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 coord text-on-surface-variant">
                          <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(paquete)
                            setModalAbierto(true)
                          }}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
                        >
                          <IconoLapiz className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void alternarActivo(paquete)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-primary"
                        >
                          {paquete.activo ? 'Retirar' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminar(paquete)}
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

      <PaqueteFormModal
        abierto={modalAbierto}
        paquete={editando}
        destinos={destinos}
        hoteles={hoteles}
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

interface FormPaquete {
  destino: string
  hotel: string
  nombre: string
  descripcion: string
  duracion_dias: string
  precio_base: string
  moneda: string
  etiquetas: string
  activo: boolean
}

const FORM_VACIO: FormPaquete = {
  destino: '',
  hotel: '',
  nombre: '',
  descripcion: '',
  duracion_dias: '',
  precio_base: '',
  moneda: 'USD',
  etiquetas: '',
  activo: true,
}

function PaqueteFormModal({
  abierto,
  paquete,
  destinos,
  hoteles,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean
  paquete: Paquete | null
  destinos: DestinoResumen[]
  hoteles: Hotel[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}) {
  const [form, setForm] = useState<FormPaquete>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setForm(
      paquete
        ? {
            destino: String(paquete.destino),
            hotel: paquete.hotel ? String(paquete.hotel) : '',
            nombre: paquete.nombre,
            descripcion: paquete.descripcion ?? '',
            duracion_dias: String(paquete.duracion_dias),
            precio_base: paquete.precio_base,
            moneda: paquete.moneda,
            etiquetas: paquete.etiquetas.join(', '),
            activo: paquete.activo,
          }
        : FORM_VACIO,
    )
  }, [abierto, paquete])

  function campo<K extends keyof FormPaquete>(clave: K, valor: FormPaquete[K]) {
    setForm((f) => ({ ...f, [clave]: valor }))
  }

  const hotelesDelDestino = form.destino
    ? hoteles.filter((h) => h.destino === Number(form.destino))
    : hoteles

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (
      !form.destino ||
      !form.nombre.trim() ||
      !form.duracion_dias ||
      !form.precio_base
    ) {
      setError('Complete destino, nombre, duración y precio base.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const payload = {
        destino: Number(form.destino),
        hotel: form.hotel ? Number(form.hotel) : null,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        duracion_dias: Number(form.duracion_dias),
        precio_base: form.precio_base,
        moneda: form.moneda,
        etiquetas: form.etiquetas
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
        activo: form.activo,
      }
      if (paquete) {
        await catalogoApi.actualizarPaquete(paquete.id, payload)
        onGuardado('Paquete actualizado en el armador.')
      } else {
        await catalogoApi.crearPaquete(payload)
        onGuardado('Paquete creado en el armador.')
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
      titulo={paquete ? 'Editar paquete' : 'Armar nuevo paquete'}
    >
      <p className="coord mb-4 text-primary">
        {paquete ? paquete.nombre : 'Nueva oferta · Cuaderno de viajes'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="coord">Destino *</span>
            <select
              value={form.destino}
              onChange={(e) => {
                campo('destino', e.target.value)
                campo('hotel', '')
              }}
              className={claseCampo}
            >
              <option value="">Seleccione un destino</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Hospedaje</span>
            <select
              value={form.hotel}
              onChange={(e) => campo('hotel', e.target.value)}
              className={claseCampo}
            >
              <option value="">Sin hospedaje asignado</option>
              {hotelesDelDestino.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Nombre del paquete *</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => campo('nombre', e.target.value)}
              placeholder="Ej. Cusco Esencial"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Descripción</span>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => campo('descripcion', e.target.value)}
              placeholder="Qué incluye el viaje, carácter de la travesía..."
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Duración (días) *</span>
            <input
              type="number"
              min="1"
              value={form.duracion_dias}
              onChange={(e) => campo('duracion_dias', e.target.value)}
              placeholder="4"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Precio base por persona *</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precio_base}
              onChange={(e) => campo('precio_base', e.target.value)}
              placeholder="0.00"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Moneda</span>
            <select
              value={form.moneda}
              onChange={(e) => campo('moneda', e.target.value)}
              className={claseCampo}
            >
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Etiquetas</span>
            <input
              type="text"
              value={form.etiquetas}
              onChange={(e) => campo('etiquetas', e.target.value)}
              placeholder="cultura, trekking, naturaleza"
              className={claseCampo}
            />
          </label>

          <label className="flex items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => campo('activo', e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary"
            />
            <span className="font-sans text-sm text-on-surface">
              Publicado en el catálogo de viajes
            </span>
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
            {enviando ? 'Guardando...' : paquete ? 'Guardar cambios' : 'Armar paquete'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}