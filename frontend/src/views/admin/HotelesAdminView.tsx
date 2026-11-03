import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  catalogoApi,
  type DestinoResumen,
  type FiltrosHotel,
  type Hotel,
  type Proveedor,
} from '@/api/catalogo'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoBasura,
  IconoEdificio,
  IconoLapiz,
  IconoLupa,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

const OPCIONES_ESTRELLAS = [5, 4, 3, 2, 1]

function estrellasTexto(n: number | null): string {
  if (!n) return 'Sin clasificar'
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)}`
}

/**
 * 22. Panel · Hospedajes → /admin/hoteles
 *
 * Libreta de hospedajes: hoteles asociados a un destino y a un proveedor,
 * con categoría, ubicación y ficha editorial.
 */
export function HotelesAdminView() {
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [destinoFiltro, setDestinoFiltro] = useState('')
  const [estrellasFiltro, setEstrellasFiltro] = useState('')
  const [filtros, setFiltros] = useState<FiltrosHotel>({})

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Hotel | null>(null)

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [provs, dests] = await Promise.all([
          (async () => {
            const acc: Proveedor[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarProveedores({
                tipo: 'hotel',
                page: pagina,
              })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
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
        ])
        if (activo) {
          setProveedores(provs)
          setDestinos(dests)
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
      const acc: Hotel[] = []
      let pagina = 1
      for (;;) {
        const data = await catalogoApi.listarHoteles({ ...filtros, page: pagina })
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setHoteles(acc)
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
      total: hoteles.length,
      activos: hoteles.filter((h) => h.activo).length,
      destinos: new Set(hoteles.map((h) => h.destino)).size,
    }),
    [hoteles],
  )

  const logoPorProveedor = useMemo(() => {
    const mapa = new Map<number, string | null>()
    for (const p of proveedores) mapa.set(p.id, p.logo_url)
    return mapa
  }, [proveedores])

  function aplicarFiltros(evento?: FormEvent) {
    evento?.preventDefault()
    setFiltros({
      q: busqueda.trim() || undefined,
      destino: destinoFiltro ? Number(destinoFiltro) : undefined,
      estrellas: estrellasFiltro ? Number(estrellasFiltro) : undefined,
    })
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(hotel: Hotel) {
    setEditando(hotel)
    setModalAbierto(true)
  }

  async function alternarActivo(hotel: Hotel) {
    try {
      const actualizado = await catalogoApi.toggleActivoHotel(hotel.id)
      setHoteles((lista) =>
        lista.map((h) => (h.id === actualizado.id ? actualizado : h)),
      )
      setAviso(
        actualizado.activo
          ? 'Hospedaje habilitado en el catálogo.'
          : 'Hospedaje retirado del catálogo.',
      )
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  async function eliminar(hotel: Hotel) {
    if (!window.confirm(`¿Eliminar definitivamente el hotel ${hotel.nombre}?`)) return
    try {
      await catalogoApi.eliminarHotel(hotel.id)
      setAviso('Hospedaje eliminado de la libreta.')
      void cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const claseCampo =
    'w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-high px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            <span className="coord">
              Libro de registro · Hospedajes · CU5 · RF-10
            </span>
          </div>
          <div className="flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Casas verificadas por la agencia</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="coord flex items-center gap-2 text-terracotta">
              <span className="regla-terracotta" />
              Libreta de hospedajes
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
              Casas &amp; posadas del catálogo
            </h1>
            <p className="font-display text-lg font-normal italic text-on-surface-variant">
              Tomo V — Hospedajes asociados a cada destino, con su categoría,
              ubicación y ficha de presentación.
            </p>
          </div>

          <Button className="group shrink-0" onClick={abrirNuevo}>
            <IconoEdificio className="h-4 w-4" />
            Registrar hospedaje
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-parchment-border py-3">
          <span className="coord">
            Hospedajes <strong className="ml-1 text-primary">{resumen.total}</strong>
          </span>
          <span className="coord">
            Activos <strong className="ml-1 text-primary">{resumen.activos}</strong>
          </span>
          <span className="coord">
            Destinos <strong className="ml-1 text-primary">{resumen.destinos}</strong>
          </span>
        </div>
      </header>

      <section className="mt-8 flex flex-col gap-4 rounded-lg bg-surface-container-low p-6 shadow-paper sm:p-8">
        <form
          onSubmit={aplicarFiltros}
          className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
        >
          <label className="flex w-full flex-col gap-1.5 lg:w-2/5">
            <span className="coord">Búsqueda de hospedaje</span>
            <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5">
              <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, proveedor o dirección..."
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

          <label className="flex flex-col gap-1.5">
            <span className="coord">Categoría</span>
            <select
              value={estrellasFiltro}
              onChange={(e) => setEstrellasFiltro(e.target.value)}
              className="min-w-36 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Todas</option>
              {OPCIONES_ESTRELLAS.map((n) => (
                <option key={n} value={n}>
                  {n} estrellas
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
            Mostrando <strong className="text-primary">{hoteles.length}</strong>{' '}
            hospedajes
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
          <p className="nota-manuscrita">Abriendo la libreta de hospedajes...</p>
        ) : hoteles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">
              Sin hospedajes que mostrar
            </p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Registre una casa o ajuste la búsqueda para ver hospedajes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full min-w-4xl border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="coord px-5 py-3 font-normal">Hospedaje</th>
                  <th className="coord hidden px-5 py-3 font-normal sm:table-cell">
                    Destino
                  </th>
                  <th className="coord px-5 py-3 font-normal">Categoría</th>
                  <th className="coord hidden px-5 py-3 font-normal lg:table-cell">
                    Dirección
                  </th>
                  <th className="coord px-5 py-3 font-normal">Estado</th>
                  <th className="coord px-5 py-3 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hoteles.map((hotel) => (
                  <tr
                    key={hotel.id}
                    className="border-b border-parchment-border/60 last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-container-high">
                          {logoPorProveedor.get(hotel.proveedor) ? (
                            <img
                              src={logoPorProveedor.get(hotel.proveedor) as string}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <IconoEdificio className="h-5 w-5 text-primary/40" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <span className="font-display text-lg text-on-surface">
                            {hotel.nombre}
                          </span>
                          <span className="coord mt-0.5 block">
                            {hotel.proveedor_nombre}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant sm:table-cell">
                      {hotel.destino_nombre}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-sm text-terracotta">
                        {estrellasTexto(hotel.estrellas)}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant lg:table-cell">
                      {hotel.direccion || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {hotel.activo ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 coord text-on-surface-variant">
                          <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
                          Retirado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => abrirEditar(hotel)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
                        >
                          <IconoLapiz className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void alternarActivo(hotel)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-primary"
                        >
                          {hotel.activo ? 'Retirar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminar(hotel)}
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

      <FormularioHotel
        abierto={modalAbierto}
        hotel={editando}
        proveedores={proveedores}
        destinos={destinos}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={(mensaje) => {
          setAviso(mensaje)
          void cargar()
        }}
        claseCampo={claseCampo}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Formulario de alta / edición                                               */
/* -------------------------------------------------------------------------- */

interface FormHotel {
  proveedor: string
  destino: string
  nombre: string
  estrellas: string
  direccion: string
  latitud: string
  longitud: string
  descripcion: string
  activo: boolean
}

const FORM_VACIO: FormHotel = {
  proveedor: '',
  destino: '',
  nombre: '',
  estrellas: '',
  direccion: '',
  latitud: '',
  longitud: '',
  descripcion: '',
  activo: true,
}

function FormularioHotel({
  abierto,
  hotel,
  proveedores,
  destinos,
  onCerrar,
  onGuardado,
  claseCampo,
}: {
  abierto: boolean
  hotel: Hotel | null
  proveedores: Proveedor[]
  destinos: DestinoResumen[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
  claseCampo: string
}) {
  const [form, setForm] = useState<FormHotel>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setForm(
      hotel
        ? {
            proveedor: String(hotel.proveedor),
            destino: String(hotel.destino),
            nombre: hotel.nombre,
            estrellas: hotel.estrellas ? String(hotel.estrellas) : '',
            direccion: hotel.direccion ?? '',
            latitud: hotel.latitud ?? '',
            longitud: hotel.longitud ?? '',
            descripcion: hotel.descripcion ?? '',
            activo: hotel.activo,
          }
        : FORM_VACIO,
    )
  }, [abierto, hotel])

  function campo<K extends keyof FormHotel>(clave: K, valor: FormHotel[K]) {
    setForm((f) => ({ ...f, [clave]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form.proveedor || !form.destino || !form.nombre.trim()) {
      setError('Complete proveedor, destino y nombre del hospedaje.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const payload = {
        proveedor: Number(form.proveedor),
        destino: Number(form.destino),
        nombre: form.nombre.trim(),
        estrellas: form.estrellas ? Number(form.estrellas) : null,
        direccion: form.direccion.trim() || null,
        latitud: form.latitud.trim() || null,
        longitud: form.longitud.trim() || null,
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
      }
      if (hotel) {
        await catalogoApi.actualizarHotel(hotel.id, payload)
        onGuardado('Hospedaje actualizado en la libreta.')
      } else {
        await catalogoApi.crearHotel(payload)
        onGuardado('Hospedaje registrado en la libreta.')
      }
      onCerrar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      titulo={hotel ? 'Editar hospedaje' : 'Registrar hospedaje'}
    >
      <p className="coord mb-4 text-primary">
        {hotel
          ? `${hotel.nombre} · ${hotel.destino_nombre}`
          : 'Nueva casa · Archivo de hospedajes'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="coord">Proveedor hotelero *</span>
            <select
              value={form.proveedor}
              onChange={(e) => campo('proveedor', e.target.value)}
              className={claseCampo}
            >
              <option value="">Seleccione un proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Destino *</span>
            <select
              value={form.destino}
              onChange={(e) => campo('destino', e.target.value)}
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

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Nombre del hospedaje *</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => campo('nombre', e.target.value)}
              placeholder="Ej. Posada del Inca"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Categoría</span>
            <select
              value={form.estrellas}
              onChange={(e) => campo('estrellas', e.target.value)}
              className={claseCampo}
            >
              <option value="">Sin clasificar</option>
              {OPCIONES_ESTRELLAS.map((n) => (
                <option key={n} value={n}>
                  {n} estrellas
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Dirección</span>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => campo('direccion', e.target.value)}
              placeholder="Calle, número, barrio"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Latitud</span>
            <input
              type="number"
              step="0.000001"
              value={form.latitud}
              onChange={(e) => campo('latitud', e.target.value)}
              placeholder="-13.518000"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Longitud</span>
            <input
              type="number"
              step="0.000001"
              value={form.longitud}
              onChange={(e) => campo('longitud', e.target.value)}
              placeholder="-71.978000"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Ficha del hospedaje</span>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => campo('descripcion', e.target.value)}
              placeholder="Ambientes, servicios y carácter de la casa..."
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
              Visible en el catálogo público
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
            {enviando ? 'Guardando...' : hotel ? 'Guardar cambios' : 'Registrar hospedaje'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}