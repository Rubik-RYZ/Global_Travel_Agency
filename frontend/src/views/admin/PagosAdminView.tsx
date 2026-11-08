import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { descargarBlob, pagosApi } from '@/api/pagos'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoDescarga,
  IconoDocumento,
  IconoFlechaIzquierda,
  IconoFlechaDerecha,
  IconoLupa,
  IconoMoneda,
} from '@/components/ui/Iconos'
import type {
  EstadoPago,
  PagosAdminPagina,
  PagoAdmin,
} from '@/types/pago.types'
import { mensajeDeError } from '@/utils/validators'

const formatoBs = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  maximumFractionDigits: 2,
})

const OPCIONES_ESTADO: { valor: EstadoPago | ''; texto: string }[] = [
  { valor: '', texto: 'Todos los estados' },
  { valor: 'aprobado', texto: 'Aprobado' },
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'fallido', texto: 'Fallido' },
  { valor: 'reembolsado', texto: 'Reembolsado' },
]

const OPCIONES_METODO = [
  { valor: '', texto: 'Todos los métodos' },
  { valor: 'efectivo', texto: 'Efectivo' },
  { valor: 'tarjeta', texto: 'Tarjeta' },
  { valor: 'qr', texto: 'QR' },
  { valor: 'transferencia', texto: 'Transferencia' },
]

const ETIQUETA_METODO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  qr: 'QR',
  transferencia: 'Transferencia',
}

const ESTILO_ESTADO: Record<EstadoPago, string> = {
  aprobado: 'bg-emerald-100 text-emerald-800',
  pendiente: 'bg-amber-100 text-amber-800',
  fallido: 'bg-rose-100 text-rose-800',
  reembolsado: 'bg-slate-200 text-slate-700',
}

function bs(valor: string | number | null | undefined) {
  return formatoBs.format(Number(valor ?? 0))
}

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function Kpi({
  etiqueta,
  valor,
  detalle,
  icono,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  icono: ReactNode
}) {
  return (
    <div className="rounded-lg border border-parchment-border bg-surface-container-lowest p-4 shadow-paper">
      <div className="flex items-center justify-between gap-2">
        <p className="coord text-on-surface-variant">{etiqueta}</p>
        <span className="text-terracotta">{icono}</span>
      </div>
      <p className="mt-2 font-display text-2xl leading-none text-on-surface">{valor}</p>
      {detalle && (
        <p className="mt-1 font-sans text-[11px] text-on-surface-variant">{detalle}</p>
      )}
    </div>
  )
}

function BotonPagina({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function PagosAdminView() {
  const [borrador, setBorrador] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<EstadoPago | ''>('')
  const [metodo, setMetodo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const [datos, setDatos] = useState<PagosAdminPagina | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [descargandoId, setDescargandoId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    if (desde && hasta && desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la final.')
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    try {
      const data = await pagosApi.listarPagos({
        q: q || undefined,
        estado: estado || undefined,
        metodo: metodo || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page: pagina,
      })
      setDatos(data)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [q, estado, metodo, desde, hasta, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function buscar() {
    setPagina(1)
    setQ(borrador.trim())
  }

  function limpiar() {
    setBorrador('')
    setQ('')
    setEstado('')
    setMetodo('')
    setDesde('')
    setHasta('')
    setPagina(1)
  }

  async function descargar(pago: PagoAdmin) {
    setDescargandoId(pago.id)
    setError(null)
    try {
      const blob = await pagosApi.descargarBoleta(pago.reserva)
      descargarBlob(blob, `boleta-${pago.reserva_codigo}.pdf`)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setDescargandoId(null)
    }
  }

  const totales = datos?.totales
  const pagos = datos?.results ?? []
  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.count / 20)) : 1
  const hayFiltros = Boolean(q || estado || metodo || desde || hasta)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="border-b border-parchment-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary">
              <IconoMoneda className="h-4 w-4" />
              <span>CU9 · Libro de pagos</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-on-surface">
              Control de cobros y boletas
            </h1>
            <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant">
              Registro consolidado de pagos del panel. Consulte por reserva, cliente,
              estado o método, y descargue la boleta de los cobros aprobados.
            </p>
          </div>
          <div className="coord text-right text-on-surface-variant">
            {datos ? `${datos.count} pagos encontrados` : 'Consultando el libro…'}
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          etiqueta="Registros"
          valor={String(totales?.total_registros ?? 0)}
          detalle="Según los filtros activos"
          icono={<IconoDocumento className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Cobrado"
          valor={bs(totales?.aprobado_bob)}
          detalle="Pagos aprobados en Bs"
          icono={<IconoMoneda className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Pendiente"
          valor={bs(totales?.pendiente_bob)}
          detalle="Pagos por confirmar"
          icono={<IconoDescarga className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Reembolsado"
          valor={bs(totales?.reembolsado_bob)}
          detalle="Devoluciones registradas"
          icono={<IconoFlechaIzquierda className="h-4 w-4" />}
        />
      </div>

      <section className="rounded-lg border border-parchment-border bg-surface-container-low p-5 shadow-paper">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            buscar()
          }}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.5fr)_1fr_1fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1.5">
            <span className="coord">Buscar</span>
            <span className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface px-3 py-2">
              <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
              <input
                type="search"
                value={borrador}
                onChange={(event) => setBorrador(event.target.value)}
                placeholder="Reserva, cliente o documento"
                className="w-full bg-transparent font-sans text-sm text-on-surface outline-none placeholder:text-stamp-sepia/60"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Estado</span>
            <select
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value as EstadoPago | '')
                setPagina(1)
              }}
              className="rounded-md border border-outline-variant/60 bg-surface px-3 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              {OPCIONES_ESTADO.map((opcion) => (
                <option key={opcion.valor || 'todos'} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Método</span>
            <select
              value={metodo}
              onChange={(event) => {
                setMetodo(event.target.value)
                setPagina(1)
              }}
              className="rounded-md border border-outline-variant/60 bg-surface px-3 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              {OPCIONES_METODO.map((opcion) => (
                <option key={opcion.valor || 'todos'} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(event) => {
                setDesde(event.target.value)
                setPagina(1)
              }}
              className="rounded-md border border-outline-variant/60 bg-surface px-3 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(event) => {
                setHasta(event.target.value)
                setPagina(1)
              }}
              className="rounded-md border border-outline-variant/60 bg-surface px-3 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>

          <div className="flex items-end gap-2">
            <Button type="submit" tamano="sm">
              <IconoLupa className="h-4 w-4" />
              Buscar
            </Button>
            {hayFiltros && (
              <Button type="button" variante="ghost" tamano="sm" onClick={limpiar}>
                Limpiar
              </Button>
            )}
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 font-sans text-sm text-error">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-parchment-border bg-surface-container-high">
                {[
                  'Fecha',
                  'Reserva / Cliente',
                  'Expedición',
                  'Monto',
                  'Equivalente Bs',
                  'Método',
                  'Estado',
                  'Boleta',
                ].map((cabecera, indice) => (
                  <th
                    key={cabecera}
                    className={`whitespace-nowrap px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ${
                      indice >= 3 && indice <= 4 ? 'text-right' : ''
                    }`}
                  >
                    {cabecera}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-border/60">
              {cargando ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center font-sans text-xs text-on-surface-variant"
                  >
                    Abriendo el libro de pagos…
                  </td>
                </tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center font-sans text-xs text-on-surface-variant"
                  >
                    No hay pagos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr
                    key={pago.id}
                    className="align-top transition-colors hover:bg-surface-container-low/70"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-sans text-xs text-on-surface-variant">
                      {fecha(pago.creado_en)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/admin/reservas/${pago.reserva}`}
                        className="font-sans text-sm font-semibold text-primary hover:underline"
                      >
                        {pago.reserva_codigo}
                      </Link>
                      <p className="font-sans text-xs text-on-surface">
                        {pago.cliente_nombre}
                      </p>
                      <p className="font-sans text-[11px] text-on-surface-variant">
                        {pago.cliente_documento || 'Sin documento'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-sans text-sm text-on-surface">
                        {pago.paquete_nombre}
                      </p>
                      <p className="font-sans text-xs text-on-surface-variant">
                        {pago.destino_nombre} · salida {pago.fecha_salida}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-sans text-sm text-on-surface">
                      {pago.monto} {pago.moneda}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-sans text-sm font-semibold text-primary">
                      {bs(pago.monto_bob)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-sans text-xs capitalize text-on-surface-variant">
                      {ETIQUETA_METODO[pago.metodo] ?? pago.metodo}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider ${ESTILO_ESTADO[pago.estado]}`}
                      >
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {pago.estado === 'aprobado' ? (
                        <button
                          type="button"
                          onClick={() => void descargar(pago)}
                          disabled={descargandoId === pago.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container disabled:opacity-50"
                        >
                          <IconoDescarga className="h-3.5 w-3.5" />
                          {descargandoId === pago.id ? 'Generando…' : 'PDF'}
                        </button>
                      ) : (
                        <span className="font-sans text-[11px] text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-parchment-border px-4 py-3 sm:flex-row">
          <p className="font-sans text-xs text-on-surface-variant">
            {datos
              ? `Página ${pagina} de ${totalPaginas} · ${datos.count} registros`
              : 'Sin datos'}
          </p>
          <div className="flex items-center gap-2">
            <BotonPagina
              onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              disabled={!datos?.previous || cargando}
            >
              <IconoFlechaIzquierda className="h-3.5 w-3.5" />
              Anterior
            </BotonPagina>
            <BotonPagina
              onClick={() => setPagina((actual) => actual + 1)}
              disabled={!datos?.next || cargando}
            >
              Siguiente
              <IconoFlechaDerecha className="h-3.5 w-3.5" />
            </BotonPagina>
          </div>
        </div>
      </section>
    </div>
  )
}
