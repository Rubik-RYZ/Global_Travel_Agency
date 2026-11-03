import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  catalogoApi,
  type Aeropuerto,
  type FiltrosVuelo,
  type Proveedor,
  type Vuelo,
} from '@/api/catalogo'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoBasura,
  IconoBillete,
  IconoFlechaDerecha,
  IconoLapiz,
  IconoLupa,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

const MONEDAS = ['USD', 'BOB', 'EUR']

function fechaHora(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dinero(precio: string, moneda: string): string {
  const n = Number(precio)
  if (Number.isNaN(n)) return `${moneda} —`
  return `${moneda} ${n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function aInputFecha(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

/**
 * 21. Panel · Tablero de vuelos → /admin/vuelos
 *
 * Libreta operativa de la agencia: rutas, horarios, tarifas y cupos de las
 * aerolíneas que ya están registradas como proveedores. Mantiene el tono
 * editorial del cuaderno de viajes.
 */
export function VuelosAdminView() {
  const [vuelos, setVuelos] = useState<Vuelo[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [proveedorFiltro, setProveedorFiltro] = useState('')
  const [origenFiltro, setOrigenFiltro] = useState('')
  const [destinoFiltro, setDestinoFiltro] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosVuelo>({})

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Vuelo | null>(null)

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [provs, aero] = await Promise.all([
          (async () => {
            const acc: Proveedor[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarProveedores({
                tipo: 'aerolinea',
                page: pagina,
              })
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
          (async () => {
            const acc: Aeropuerto[] = []
            let pagina = 1
            for (;;) {
              const data = await catalogoApi.listarAeropuertos(undefined, pagina)
              acc.push(...data.results)
              if (!data.next) break
              pagina += 1
            }
            return acc
          })(),
        ])
        if (activo) {
          setProveedores(provs)
          setAeropuertos(aero)
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
      const acc: Vuelo[] = []
      let pagina = 1
      for (;;) {
        const data = await catalogoApi.listarVuelos({ ...filtros, page: pagina })
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setVuelos(acc)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [filtros])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const metricas = useMemo(
    () => ({
      total: vuelos.length,
      aerolineas: new Set(vuelos.map((v) => v.proveedor)).size,
      rutas: new Set(vuelos.map((v) => `${v.origen}-${v.destino}`)).size,
      cupos: vuelos.reduce((suma, v) => suma + v.cupos_disponibles, 0),
    }),
    [vuelos],
  )

  function aplicarFiltros(evento?: FormEvent) {
    evento?.preventDefault()
    setFiltros({
      q: busqueda.trim() || undefined,
      proveedor: proveedorFiltro ? Number(proveedorFiltro) : undefined,
      origen: origenFiltro || undefined,
      destino: destinoFiltro || undefined,
      disponibles: soloDisponibles || undefined,
    })
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(vuelo: Vuelo) {
    setEditando(vuelo)
    setModalAbierto(true)
  }

  async function eliminar(vuelo: Vuelo) {
    if (!window.confirm(`¿Retirar del tablero el vuelo ${vuelo.numero_vuelo}?`)) return
    try {
      await catalogoApi.eliminarVuelo(vuelo.id)
      setAviso('Vuelo retirado del tablero.')
      void cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Cabecera y métricas ─────────────────────────────────────────── */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-high px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            <span className="coord">
              Libro de registro · Operaciones de vuelo · CU4 · RF-09
            </span>
          </div>
          <div className="flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Conexiones verificadas por la casa</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="coord flex items-center gap-2 text-terracotta">
              <span className="regla-terracotta" />
              Atelier de rutas y conexiones
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
              Libreta de vuelos &amp; conexiones de confianza
            </h1>
            <p className="font-display text-lg font-normal italic text-on-surface-variant">
              Tomo IV — Rutas, horarios, tarifas y cupos de las aerolíneas asociadas
              a Illimani Global Travel.
            </p>
          </div>

          <Button className="group shrink-0" onClick={abrirNuevo}>
            <IconoBillete className="h-4 w-4" />
            Registrar vuelo
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-parchment-border py-3">
          <span className="coord">
            Vuelos <strong className="ml-1 text-primary">{metricas.total}</strong>
          </span>
          <span className="coord">
            Aerolíneas <strong className="ml-1 text-primary">{metricas.aerolineas}</strong>
          </span>
          <span className="coord">
            Rutas <strong className="ml-1 text-primary">{metricas.rutas}</strong>
          </span>
          <span className="coord">
            Cupos <strong className="ml-1 text-primary">{metricas.cupos}</strong>
          </span>
        </div>
      </header>

      {/* ── Búsqueda y filtros ──────────────────────────────────────────── */}
      <section className="mt-8 flex flex-col gap-4 rounded-lg bg-surface-container-low p-6 shadow-paper sm:p-8">
        <form
          onSubmit={aplicarFiltros}
          className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
        >
          <label className="flex w-full flex-col gap-1.5 lg:w-2/5">
            <span className="coord">Búsqueda de vuelo</span>
            <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5">
              <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Número, aerolínea o ruta..."
                className="w-full bg-transparent font-sans text-sm text-ink-warm outline-none placeholder:text-stamp-sepia/60"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Aerolínea</span>
            <select
              value={proveedorFiltro}
              onChange={(e) => setProveedorFiltro(e.target.value)}
              className="min-w-44 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Todas</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Origen</span>
            <select
              value={origenFiltro}
              onChange={(e) => setOrigenFiltro(e.target.value)}
              className="min-w-40 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Cualquiera</option>
              {aeropuertos.map((a) => (
                <option key={a.codigo_iata} value={a.codigo_iata}>
                  {a.codigo_iata} · {a.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Destino</span>
            <select
              value={destinoFiltro}
              onChange={(e) => setDestinoFiltro(e.target.value)}
              className="min-w-40 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Cualquiera</option>
              {aeropuertos.map((a) => (
                <option key={a.codigo_iata} value={a.codigo_iata}>
                  {a.codigo_iata} · {a.nombre}
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
            Mostrando <strong className="text-primary">{vuelos.length}</strong> vuelos
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

      {/* ── Tabla de vuelos ─────────────────────────────────────────────── */}
      <section className="mt-8">
        {cargando ? (
          <p className="nota-manuscrita">Abriendo la libreta de vuelos...</p>
        ) : vuelos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">Sin vuelos que mostrar</p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Registre una ruta o ajuste la búsqueda para ver conexiones.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full min-w-4xl border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="coord px-5 py-3 font-normal">Vuelo</th>
                  <th className="coord px-5 py-3 font-normal">Ruta</th>
                  <th className="coord hidden px-5 py-3 font-normal md:table-cell">Salida</th>
                  <th className="coord hidden px-5 py-3 font-normal lg:table-cell">Llegada</th>
                  <th className="coord px-5 py-3 font-normal">Tarifa</th>
                  <th className="coord px-5 py-3 font-normal">Cupos</th>
                  <th className="coord px-5 py-3 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vuelos.map((vuelo) => (
                  <tr
                    key={vuelo.id}
                    className="border-b border-parchment-border/60 last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-display text-lg text-on-surface">
                        {vuelo.numero_vuelo}
                      </span>
                      <span className="coord mt-0.5 block">{vuelo.proveedor_nombre}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2 font-sans text-sm text-on-surface">
                        <span className="font-medium">{vuelo.origen}</span>
                        <IconoFlechaDerecha className="h-3.5 w-3.5 text-terracotta" />
                        <span className="font-medium">{vuelo.destino}</span>
                      </span>
                      <span className="coord mt-0.5 block">
                        {vuelo.origen_nombre} → {vuelo.destino_nombre}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant md:table-cell">
                      {fechaHora(vuelo.salida)}
                    </td>
                    <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant lg:table-cell">
                      {fechaHora(vuelo.llegada)}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm font-medium text-on-surface">
                      {dinero(vuelo.precio, vuelo.moneda)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-sm text-on-surface">
                        {vuelo.cupos_disponibles} / {vuelo.cupos_totales}
                      </span>
                      <span className="mt-1 block">
                        {vuelo.cupos_disponibles > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
                            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 coord text-on-surface-variant">
                            <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
                            Agotado
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => abrirEditar(vuelo)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
                        >
                          <IconoLapiz className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminar(vuelo)}
                          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia hover:text-error"
                        >
                          <IconoBasura className="h-3.5 w-3.5" />
                          Retirar
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

      <VueloFormModal
        abierto={modalAbierto}
        vuelo={editando}
        proveedores={proveedores}
        aeropuertos={aeropuertos}
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

interface FormVuelo {
  proveedor: string
  numero_vuelo: string
  origen: string
  destino: string
  salida: string
  llegada: string
  precio: string
  moneda: string
  cupos_totales: string
  cupos_disponibles: string
  referencia_externa: string
}

const FORM_VACIO: FormVuelo = {
  proveedor: '',
  numero_vuelo: '',
  origen: '',
  destino: '',
  salida: '',
  llegada: '',
  precio: '',
  moneda: 'USD',
  cupos_totales: '',
  cupos_disponibles: '',
  referencia_externa: '',
}

function VueloFormModal({
  abierto,
  vuelo,
  proveedores,
  aeropuertos,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean
  vuelo: Vuelo | null
  proveedores: Proveedor[]
  aeropuertos: Aeropuerto[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}) {
  const [form, setForm] = useState<FormVuelo>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setForm(
      vuelo
        ? {
            proveedor: String(vuelo.proveedor),
            numero_vuelo: vuelo.numero_vuelo,
            origen: vuelo.origen,
            destino: vuelo.destino,
            salida: aInputFecha(vuelo.salida),
            llegada: aInputFecha(vuelo.llegada),
            precio: vuelo.precio,
            moneda: vuelo.moneda,
            cupos_totales: String(vuelo.cupos_totales),
            cupos_disponibles: String(vuelo.cupos_disponibles),
            referencia_externa: vuelo.referencia_externa ?? '',
          }
        : FORM_VACIO,
    )
  }, [abierto, vuelo])

  function campo<K extends keyof FormVuelo>(clave: K, valor: FormVuelo[K]) {
    setForm((f) => ({ ...f, [clave]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (
      !form.proveedor ||
      !form.numero_vuelo.trim() ||
      !form.origen ||
      !form.destino ||
      !form.salida ||
      !form.llegada ||
      !form.precio ||
      !form.cupos_totales
    ) {
      setError('Complete aerolínea, número, ruta, horarios, tarifa y cupos.')
      return
    }
    if (form.origen === form.destino) {
      setError('El origen y el destino deben ser distintos.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const payload = {
        proveedor: Number(form.proveedor),
        numero_vuelo: form.numero_vuelo.trim(),
        origen: form.origen,
        destino: form.destino,
        salida: new Date(form.salida).toISOString(),
        llegada: new Date(form.llegada).toISOString(),
        precio: form.precio,
        moneda: form.moneda,
        cupos_totales: Number(form.cupos_totales),
        cupos_disponibles: form.cupos_disponibles
          ? Number(form.cupos_disponibles)
          : undefined,
        referencia_externa: form.referencia_externa.trim() || null,
      }
      if (vuelo) {
        await catalogoApi.actualizarVuelo(vuelo.id, payload)
        onGuardado('Vuelo actualizado en la libreta.')
      } else {
        await catalogoApi.crearVuelo(payload)
        onGuardado('Vuelo registrado en la libreta.')
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
      titulo={vuelo ? 'Editar vuelo de la libreta' : 'Registrar conexión de vuelo'}
    >
      <p className="coord mb-4 text-primary">
        {vuelo
          ? `${vuelo.numero_vuelo} · ${vuelo.proveedor_nombre}`
          : 'Nueva ruta · Archivo operativo'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="coord">Aerolínea *</span>
            <select
              value={form.proveedor}
              onChange={(e) => campo('proveedor', e.target.value)}
              className={claseCampo}
            >
              <option value="">Seleccione una aerolínea</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Número de vuelo *</span>
            <input
              type="text"
              value={form.numero_vuelo}
              onChange={(e) => campo('numero_vuelo', e.target.value)}
              placeholder="Ej. OB 123"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Origen *</span>
            <select
              value={form.origen}
              onChange={(e) => campo('origen', e.target.value)}
              className={claseCampo}
            >
              <option value="">Seleccione origen</option>
              {aeropuertos.map((a) => (
                <option key={a.codigo_iata} value={a.codigo_iata}>
                  {a.codigo_iata} · {a.nombre}
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
              <option value="">Seleccione destino</option>
              {aeropuertos.map((a) => (
                <option key={a.codigo_iata} value={a.codigo_iata}>
                  {a.codigo_iata} · {a.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Salida *</span>
            <input
              type="datetime-local"
              value={form.salida}
              onChange={(e) => campo('salida', e.target.value)}
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Llegada *</span>
            <input
              type="datetime-local"
              value={form.llegada}
              onChange={(e) => campo('llegada', e.target.value)}
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Tarifa *</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => campo('precio', e.target.value)}
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
            <span className="coord">Cupos totales *</span>
            <input
              type="number"
              min="0"
              value={form.cupos_totales}
              onChange={(e) => campo('cupos_totales', e.target.value)}
              placeholder="0"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
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

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Referencia externa</span>
            <input
              type="text"
              value={form.referencia_externa}
              onChange={(e) => campo('referencia_externa', e.target.value)}
              placeholder="Id en Amadeus u otro proveedor (opcional)"
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
            {enviando ? 'Guardando...' : vuelo ? 'Guardar cambios' : 'Registrar vuelo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}