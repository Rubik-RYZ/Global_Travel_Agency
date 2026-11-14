import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { descargarBlob } from '@/api/pagos'
import { reportesApi } from '@/api/reportes'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoCalendario,
  IconoDescarga,
  IconoMoneda,
  IconoPortapapeles,
  IconoReloj,
} from '@/components/ui/Iconos'
import type {
  Agrupacion,
  Canal,
  PuntoSerie,
  ReporteOcupacion,
  ReporteVentas,
} from '@/types/reportes.types'
import { mensajeDeError } from '@/utils/validators'

const formatoBs = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  maximumFractionDigits: 2,
})
const formatoNumero = new Intl.NumberFormat('es-BO')

function bs(valor: number) {
  return formatoBs.format(valor ?? 0)
}

function isoLocal(fecha: Date) {
  const desfase = fecha.getTimezoneOffset() * 60000
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 10)
}

const HOY = new Date()
const HACE_29 = new Date(HOY.getTime() - 29 * 86400000)

function metricaDe(valor: string) {
  return valor.charAt(0).toUpperCase() + valor.slice(1)
}

function Panel({
  titulo,
  descripcion,
  children,
  className = '',
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper ${className}`}
    >
      <div className="mb-4">
        <h2 className="font-display text-lg text-on-surface">{titulo}</h2>
        {descripcion && (
          <p className="mt-0.5 font-sans text-xs leading-relaxed text-on-surface-variant">
            {descripcion}
          </p>
        )}
      </div>
      {children}
    </section>
  )
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

function TablaSimple({
  cabeceras,
  derecha = [],
  children,
}: {
  cabeceras: string[]
  derecha?: number[]
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-parchment-border">
            {cabeceras.map((cabecera, indice) => (
              <th
                key={cabecera}
                className={`pb-2 pr-3 font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ${
                  derecha.includes(indice) ? 'text-right' : ''
                }`}
              >
                {cabecera}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-parchment-border/60">{children}</tbody>
      </table>
    </div>
  )
}

function FilaVacia({ columnas }: { columnas: number }) {
  return (
    <tr>
      <td
        colSpan={columnas}
        className="py-6 text-center font-sans text-xs text-on-surface-variant"
      >
        Sin movimientos en el rango seleccionado.
      </td>
    </tr>
  )
}

function GraficoBarras({
  serie,
  metrica,
}: {
  serie: PuntoSerie[]
  metrica: 'ingresos_bob' | 'reservas'
}) {
  if (serie.length === 0) {
    return (
      <p className="py-16 text-center font-sans text-sm text-on-surface-variant">
        No hay movimientos para graficar en el periodo elegido.
      </p>
    )
  }

  const ancho = Math.max(serie.length * 46, 320)
  const alto = 240
  const margen = { arriba: 24, derecha: 12, abajo: 34, izquierda: 12 }
  const anchoPlot = ancho - margen.izquierda - margen.derecha
  const altoPlot = alto - margen.arriba - margen.abajo
  const maximo = Math.max(...serie.map((punto) => punto[metrica]), 1)
  const paso = anchoPlot / serie.length
  const anchoBarra = Math.min(26, paso * 0.62)

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="h-60 w-full"
        style={{ minWidth: ancho }}
        role="img"
        aria-label={`Grafico de ${metrica === 'ingresos_bob' ? 'ingresos' : 'reservas'} por periodo`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraccion) => {
          const y = margen.arriba + altoPlot * (1 - fraccion)
          return (
            <line
              key={fraccion}
              x1={margen.izquierda}
              x2={ancho - margen.derecha}
              y1={y}
              y2={y}
              stroke="#231a13"
              strokeOpacity="0.1"
              strokeDasharray="3 3"
            />
          )
        })}
        {serie.map((punto, indice) => {
          const valor = punto[metrica]
          const altura = (valor / maximo) * altoPlot
          const x = margen.izquierda + paso * indice + (paso - anchoBarra) / 2
          const y = margen.arriba + altoPlot - altura
          return (
            <g key={punto.periodo}>
              <rect
                x={x}
                y={y}
                width={anchoBarra}
                height={Math.max(altura, valor ? 2 : 0)}
                rx="2"
                fill="#792609"
                fillOpacity="0.85"
              >
                <title>
                  {`${punto.etiqueta}: ${
                    metrica === 'ingresos_bob' ? bs(valor) : `${valor} reservas`
                  }`}
                </title>
              </rect>
              <text
                x={x + anchoBarra / 2}
                y={alto - 18}
                textAnchor="middle"
                fontSize="9"
                fill="#231a13"
                fillOpacity="0.65"
              >
                {punto.etiqueta}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function ReportesView() {
  const [desde, setDesde] = useState(isoLocal(HACE_29))
  const [hasta, setHasta] = useState(isoLocal(HOY))
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('dia')
  const [canal, setCanal] = useState<Canal | ''>('')
  const [metrica, setMetrica] = useState<'ingresos_bob' | 'reservas'>('ingresos_bob')

  const [datos, setDatos] = useState<ReporteVentas | null>(null)
  const [ocupacion, setOcupacion] = useState<ReporteOcupacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la final.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const [ventas, ocupacionActual] = await Promise.all([
        reportesApi.ventas({ desde, hasta, agrupacion, canal }),
        reportesApi.ocupacion(),
      ])
      setDatos(ventas)
      setOcupacion(ocupacionActual)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [desde, hasta, agrupacion, canal])

  useEffect(() => {
    cargar()
  }, [cargar])

  const descargar = async () => {
    if (desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la final.')
      return
    }
    setDescargando(true)
    setError(null)
    try {
      const blob = await reportesApi.descargarVentasCsv({
        desde,
        hasta,
        agrupacion,
        canal,
      })
      descargarBlob(blob, `reporte-ventas-${desde}-${hasta}.csv`)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setDescargando(false)
    }
  }

  const resumen = datos?.resumen
  const totalesOcupacion = ocupacion?.totales

  return (
    <div className="space-y-8">
      <header className="border-b border-parchment-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary">
              <IconoPortapapeles className="h-4 w-4" />
              <span>CU12 · Reportes gerenciales</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-on-surface">
              Ventas, ingresos y ocupación
            </h1>
            <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant">
              Consulta el desempeño comercial por periodo, canal, paquete, destino y
              ventanilla. Los ingresos se expresan en bolivianos y solo consideran pagos
              aprobados.
            </p>
          </div>

          <Button
            onClick={descargar}
            disabled={descargando || cargando || desde > hasta}
            className="shrink-0"
          >
            <IconoDescarga className="h-4 w-4" />
            {descargando ? 'Generando…' : 'Descargar CSV'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 font-sans text-sm text-error">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-4 shadow-paper">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(evento) => setDesde(evento.target.value)}
              className="mt-1 w-full rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40"
            />
          </div>
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(evento) => setHasta(evento.target.value)}
              className="mt-1 w-full rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40"
            />
          </div>
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia">
              Agrupación
            </label>
            <select
              value={agrupacion}
              onChange={(evento) => setAgrupacion(evento.target.value as Agrupacion)}
              className="mt-1 w-full rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia">
              Canal
            </label>
            <select
              value={canal}
              onChange={(evento) => setCanal(evento.target.value as Canal | '')}
              className="mt-1 w-full rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2 font-sans text-sm text-on-surface outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40"
            >
              <option value="">Todos los canales</option>
              <option value="web">Portal web</option>
              <option value="agente">Asistente conversacional</option>
              <option value="personal">Mostrador / ventanilla</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variante="ghost"
              onClick={cargar}
              disabled={cargando || desde > hasta}
              className="w-full"
            >
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </section>

      {cargando && !datos ? (
        <p className="py-16 text-center font-sans text-sm text-on-surface-variant">
          Calculando reportes…
        </p>
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cargando ? 'opacity-60' : ''}`}>
            <Kpi
              etiqueta="Reservas válidas"
              valor={formatoNumero.format(resumen?.reservas ?? 0)}
              detalle={`${formatoNumero.format(resumen?.pasajeros ?? 0)} pasajeros`}
              icono={<IconoPortapapeles className="h-4 w-4" />}
            />
            <Kpi
              etiqueta="Reservas pagadas"
              valor={formatoNumero.format(resumen?.reservas_pagadas ?? 0)}
              detalle={`${formatoNumero.format(resumen?.reservas_canceladas ?? 0)} canceladas`}
              icono={<IconoPortapapeles className="h-4 w-4" />}
            />
            <Kpi
              etiqueta="Ingresos (Bs)"
              valor={bs(resumen?.ingresos_bob ?? 0)}
              detalle={`Ticket promedio ${bs(resumen?.ticket_promedio_bob ?? 0)}`}
              icono={<IconoMoneda className="h-4 w-4" />}
            />
            <Kpi
              etiqueta="Ocupación próximas salidas"
              valor={`${totalesOcupacion?.ocupacion_pct ?? 0}%`}
              detalle={`${formatoNumero.format(totalesOcupacion?.vendidos ?? 0)} de ${formatoNumero.format(totalesOcupacion?.cupos_totales ?? 0)} cupos`}
              icono={<IconoReloj className="h-4 w-4" />}
            />
            <Kpi
              etiqueta="Salidas programadas"
              valor={formatoNumero.format(totalesOcupacion?.salidas ?? 0)}
              detalle="Próximos 90 días"
              icono={<IconoCalendario className="h-4 w-4" />}
            />
            <Kpi
              etiqueta="Cupos disponibles"
              valor={formatoNumero.format(totalesOcupacion?.disponibles ?? 0)}
              detalle="Próximas salidas"
              icono={<IconoCalendario className="h-4 w-4" />}
            />
          </div>

          <Panel
            titulo="Evolución del periodo"
            descripcion="Alterna entre ingresos aprobados y cantidad de reservas válidas."
          >
            <div className="mb-4 inline-flex rounded-full border border-parchment-border bg-surface-container p-1">
              {(
                [
                  ['ingresos_bob', 'Ingresos (Bs)'],
                  ['reservas', 'Reservas'],
                ] as const
              ).map(([clave, etiqueta]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setMetrica(clave)}
                  className={`rounded-full px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                    metrica === clave
                      ? 'bg-terracotta text-white'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <GraficoBarras serie={datos?.serie ?? []} metrica={metrica} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              titulo="Ventas por canal"
              descripcion="Reservas válidas e ingresos aprobados según el origen de la venta."
            >
              <TablaSimple
                cabeceras={['Canal', 'Reservas', 'Pasajeros', 'Ingresos']}
                derecha={[1, 2, 3]}
              >
                {datos && datos.por_canal.length > 0 ? (
                  datos.por_canal.map((fila) => (
                    <tr key={fila.canal} className="text-on-surface">
                      <td className="py-2 pr-3 font-sans">{fila.etiqueta}</td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.reservas}</td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.pasajeros}</td>
                      <td className="py-2 text-right font-sans font-medium text-primary">
                        {bs(fila.ingresos_bob)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <FilaVacia columnas={4} />
                )}
              </TablaSimple>
            </Panel>

            <Panel
              titulo="Métodos de pago"
              descripcion="Pagos aprobados registrados en el periodo."
            >
              <TablaSimple cabeceras={['Método', 'Pagos', 'Ingresos']} derecha={[1, 2]}>
                {datos && datos.por_metodo.length > 0 ? (
                  datos.por_metodo.map((fila) => (
                    <tr key={fila.metodo} className="text-on-surface">
                      <td className="py-2 pr-3 font-sans">{metricaDe(fila.metodo)}</td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.pagos}</td>
                      <td className="py-2 text-right font-sans font-medium text-primary">
                        {bs(fila.ingresos_bob)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <FilaVacia columnas={3} />
                )}
              </TablaSimple>
            </Panel>
          </div>

          <Panel
            titulo="Rendimiento por paquete"
            descripcion="Los paquetes se ordenan por ingresos aprobados dentro del periodo."
          >
            <TablaSimple
              cabeceras={['Paquete', 'Destino', 'Reservas', 'Pasajeros', 'Ingresos']}
              derecha={[2, 3, 4]}
            >
              {datos && datos.por_paquete.length > 0 ? (
                datos.por_paquete.slice(0, 10).map((fila) => (
                  <tr key={`${fila.paquete_id}-${fila.paquete}`} className="text-on-surface">
                    <td className="py-2 pr-3 font-sans">{fila.paquete}</td>
                    <td className="py-2 pr-3 font-sans text-on-surface-variant">
                      {fila.destino}
                    </td>
                    <td className="py-2 pr-3 text-right font-sans">{fila.reservas}</td>
                    <td className="py-2 pr-3 text-right font-sans">{fila.pasajeros}</td>
                    <td className="py-2 text-right font-sans font-medium text-primary">
                      {bs(fila.ingresos_bob)}
                    </td>
                  </tr>
                ))
              ) : (
                <FilaVacia columnas={5} />
              )}
            </TablaSimple>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              titulo="Rendimiento por destino"
              descripcion="Ingresos y pasajeros agrupados por destino del paquete."
            >
              <TablaSimple
                cabeceras={['Destino', 'País', 'Reservas', 'Ingresos']}
                derecha={[2, 3]}
              >
                {datos && datos.por_destino.length > 0 ? (
                  datos.por_destino.slice(0, 10).map((fila) => (
                    <tr key={`${fila.destino}-${fila.pais}`} className="text-on-surface">
                      <td className="py-2 pr-3 font-sans">{fila.destino}</td>
                      <td className="py-2 pr-3 font-sans text-on-surface-variant">
                        {fila.pais}
                      </td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.reservas}</td>
                      <td className="py-2 text-right font-sans font-medium text-primary">
                        {bs(fila.ingresos_bob)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <FilaVacia columnas={4} />
                )}
              </TablaSimple>
            </Panel>

            <Panel
              titulo="Desempeño por ventanilla"
              descripcion="Reservas registradas y cobros aprobados por usuario del equipo."
            >
              <TablaSimple
                cabeceras={['Usuario', 'Reservas', 'Pasajeros', 'Ingresos']}
                derecha={[1, 2, 3]}
              >
                {datos && datos.por_empleado.length > 0 ? (
                  datos.por_empleado.map((fila) => (
                    <tr key={fila.email} className="text-on-surface">
                      <td className="py-2 pr-3 font-sans">{fila.email}</td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.reservas}</td>
                      <td className="py-2 pr-3 text-right font-sans">{fila.pasajeros}</td>
                      <td className="py-2 text-right font-sans font-medium text-primary">
                        {bs(fila.ingresos_bob)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <FilaVacia columnas={4} />
                )}
              </TablaSimple>
            </Panel>
          </div>

          <Panel
            titulo="Ocupación de salidas"
            descripcion="Próximos 90 días · cupos vendidos sobre cupos totales de cada salida."
          >
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                etiqueta="Ocupación global"
                valor={`${totalesOcupacion?.ocupacion_pct ?? 0}%`}
                icono={<IconoReloj className="h-4 w-4" />}
              />
              <Kpi
                etiqueta="Cupos vendidos"
                valor={formatoNumero.format(totalesOcupacion?.vendidos ?? 0)}
                icono={<IconoPortapapeles className="h-4 w-4" />}
              />
              <Kpi
                etiqueta="Cupos disponibles"
                valor={formatoNumero.format(totalesOcupacion?.disponibles ?? 0)}
                icono={<IconoCalendario className="h-4 w-4" />}
              />
              <Kpi
                etiqueta="Salidas en ventana"
                valor={formatoNumero.format(totalesOcupacion?.salidas ?? 0)}
                icono={<IconoCalendario className="h-4 w-4" />}
              />
            </div>

            <TablaSimple
              cabeceras={[
                'Fecha de salida',
                'Paquete',
                'Destino',
                'Vendidos',
                'Disponibles',
                'Ocupación',
              ]}
              derecha={[3, 4]}
            >
              {ocupacion && ocupacion.salidas.length > 0 ? (
                ocupacion.salidas.map((salida) => (
                  <tr key={salida.id} className="text-on-surface">
                    <td className="whitespace-nowrap py-2 pr-3 font-sans">
                      {new Date(`${salida.fecha_salida}T00:00:00`).toLocaleDateString(
                        'es-BO',
                        { day: '2-digit', month: 'short', year: 'numeric' },
                      )}
                    </td>
                    <td className="py-2 pr-3 font-sans">{salida.paquete}</td>
                    <td className="py-2 pr-3 font-sans text-on-surface-variant">
                      {salida.destino}
                    </td>
                    <td className="py-2 pr-3 text-right font-sans">{salida.vendidos}</td>
                    <td className="py-2 pr-3 text-right font-sans">
                      {salida.cupos_disponibles}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-terracotta"
                            style={{
                              width: `${Math.min(Math.max(salida.ocupacion_pct, 0), 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right font-sans text-xs font-semibold text-on-surface">
                          {salida.ocupacion_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <FilaVacia columnas={6} />
              )}
            </TablaSimple>
          </Panel>
        </>
      )}
    </div>
  )
}
