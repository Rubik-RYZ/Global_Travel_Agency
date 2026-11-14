import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { iaApi } from '@/api/ia'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Table } from '@/components/ui/Table/Table'
import {
  IconoChat,
  IconoCorazon,
  IconoDestello,
  IconoEtiqueta,
  IconoReloj,
} from '@/components/ui/Iconos'
import type {
  ModeloIA,
  PanelRecomendaciones,
  RecomendacionAdmin,
} from '@/types/ia.types'
import { formatearFechaHora } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'

function Kpi({
  etiqueta,
  valor,
  detalle,
  icono,
}: {
  etiqueta: string
  valor: string | number
  detalle: string
  icono: ReactNode
}) {
  return (
    <div className="rounded-lg border border-parchment-border bg-surface-container-lowest p-4 shadow-paper">
      <div className="flex items-center justify-between gap-2">
        <p className="coord text-on-surface-variant">{etiqueta}</p>
        <span className="text-terracotta">{icono}</span>
      </div>
      <p className="mt-2 font-display text-2xl leading-none text-on-surface">{valor}</p>
      <p className="mt-1 font-sans text-[11px] text-on-surface-variant">{detalle}</p>
    </div>
  )
}

function metricaNumero(modelo: ModeloIA, clave: string): number {
  const valor = modelo.metricas?.[clave]
  return typeof valor === 'number' ? valor : 0
}

export function RecomendacionesAdminView() {
  const [datos, setDatos] = useState<PanelRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [entrenando, setEntrenando] = useState(false)
  const [activando, setActivando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await iaApi.panelRecomendaciones())
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const entrenar = async () => {
    setEntrenando(true)
    setError(null)
    try {
      setDatos(await iaApi.entrenarRecomendador())
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEntrenando(false)
    }
  }

  const activar = async (id: number) => {
    setActivando(id)
    setError(null)
    try {
      setDatos(await iaApi.activarModeloRecomendador(id))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setActivando(null)
    }
  }

  if (cargando) {
    return (
      <p className="nota-manuscrita text-stamp-sepia">
        Reuniendo las actas del recomendador...
      </p>
    )
  }

  if (!datos) {
    return (
      <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
        {error ?? 'No se pudo cargar el panel de recomendaciones.'}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-4 border-b border-parchment-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="coord inline-flex items-center gap-2 text-terracotta">
            <IconoDestello className="h-4 w-4" />
            CU11 · Recomendaciones personalizadas
          </span>
          <h1 className="mt-3 font-display text-3xl leading-tight text-on-surface sm:text-4xl">
            Calidad de recomendaciones
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant">
            Seguimiento de las sugerencias generadas, mostradas y aceptadas por
            los viajeros. La tasa de aceptación ayuda a calibrar el recomendador.
          </p>
        </div>
        <Button variante="ghost" onClick={() => void cargar()}>
          <IconoReloj className="h-4 w-4" />
          Actualizar
        </Button>
      </header>

      {error && (
        <p className="mt-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Generadas"
          valor={datos.resumen.total}
          detalle="Sugerencias registradas"
          icono={<IconoChat className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Mostradas"
          valor={datos.resumen.mostradas}
          detalle="Vistas por el viajero"
          icono={<IconoEtiqueta className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Aceptadas"
          valor={datos.resumen.aceptadas}
          detalle="Clics de interés"
          icono={<IconoCorazon className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Tasa de aceptación"
          valor={`${datos.resumen.tasa_aceptacion}%`}
          detalle="Aceptadas / mostradas"
          icono={<IconoDestello className="h-4 w-4" />}
        />
      </div>

      <section className="mt-8 rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-on-surface">Gestión del modelo</h2>
            <p className="mt-0.5 max-w-2xl font-sans text-xs text-on-surface-variant">
              Cada entrenamiento crea una versión con las métricas del histórico
              de reservas y aceptaciones. El recomendador usa el histórico del
              cliente para personalizar la afinidad.
            </p>
          </div>
          <Button
            variante="primary"
            tamano="sm"
            onClick={() => void entrenar()}
            disabled={entrenando}
          >
            <IconoDestello className="h-4 w-4" />
            {entrenando ? 'Entrenando...' : 'Entrenar nueva versión'}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-parchment-border bg-surface-container p-3">
            <p className="coord">Versión activa</p>
            <p className="mt-1 font-sans text-sm text-on-surface">
              {datos.modelo_activo ? `v${datos.modelo_activo.version}` : 'Sin modelo'}
            </p>
          </div>
          <div className="rounded-md border border-parchment-border bg-surface-container p-3">
            <p className="coord">Paquetes activos</p>
            <p className="mt-1 font-sans text-sm text-on-surface">
              {datos.historial.paquetes_activos}
            </p>
          </div>
          <div className="rounded-md border border-parchment-border bg-surface-container p-3">
            <p className="coord">Clientes con historial</p>
            <p className="mt-1 font-sans text-sm text-on-surface">
              {datos.historial.clientes_con_historial}
            </p>
          </div>
          <div className="rounded-md border border-parchment-border bg-surface-container p-3">
            <p className="coord">Reservas históricas</p>
            <p className="mt-1 font-sans text-sm text-on-surface">
              {datos.historial.reservas_historicas}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Table<ModeloIA>
            columnas={[
              {
                clave: 'version',
                encabezado: 'Versión',
                render: (fila) => `v${fila.version}`,
              },
              {
                clave: 'estado',
                encabezado: 'Estado',
                render: (fila) =>
                  fila.activo ? (
                    <Badge color="bosque">Activa</Badge>
                  ) : (
                    <Badge color="neutro">Inactiva</Badge>
                  ),
              },
              {
                clave: 'sugerencias',
                encabezado: 'Sugerencias',
                render: (fila) => metricaNumero(fila, 'total_recomendaciones'),
              },
              {
                clave: 'tasa',
                encabezado: 'Tasa histórica',
                render: (fila) => `${metricaNumero(fila, 'tasa_aceptacion')}%`,
              },
              {
                clave: 'entrenado_en',
                encabezado: 'Entrenado',
                render: (fila) => formatearFechaHora(fila.entrenado_en),
              },
              {
                clave: 'acciones',
                encabezado: '',
                render: (fila) => (
                  <Button
                    variante="ghost"
                    tamano="sm"
                    onClick={() => void activar(fila.id)}
                    disabled={fila.activo || activando === fila.id}
                  >
                    {fila.activo
                      ? 'En uso'
                      : activando === fila.id
                        ? 'Activando...'
                        : 'Activar'}
                  </Button>
                ),
              },
            ]}
            datos={datos.modelos}
            vacio="Aún no se ha entrenado el recomendador."
          />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper">
          <h2 className="font-display text-lg text-on-surface">Por paquete</h2>
          <p className="mb-4 mt-0.5 font-sans text-xs text-on-surface-variant">
            Los destinos que más despiertan interés.
          </p>
          <Table
            columnas={[
              { clave: 'paquete__nombre', encabezado: 'Paquete' },
              { clave: 'paquete__destino__nombre', encabezado: 'Destino' },
              { clave: 'total', encabezado: 'Sugerencias' },
              { clave: 'mostradas', encabezado: 'Mostradas' },
              { clave: 'aceptadas', encabezado: 'Aceptadas' },
            ]}
            datos={datos.por_paquete}
            vacio="Aún no hay recomendaciones registradas."
          />
        </section>

        <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper">
          <h2 className="font-display text-lg text-on-surface">Por modelo</h2>
          <p className="mb-4 mt-0.5 font-sans text-xs text-on-surface-variant">
            Versiones del recomendador que han generado sugerencias.
          </p>
          <Table
            columnas={[
              { clave: 'modelo__nombre', encabezado: 'Modelo' },
              { clave: 'modelo__version', encabezado: 'Versión' },
              { clave: 'total', encabezado: 'Sugerencias' },
              { clave: 'aceptadas', encabezado: 'Aceptadas' },
            ]}
            datos={datos.por_modelo}
            vacio="Sin actividad del modelo."
          />
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-parchment-border bg-surface-container-lowest p-5 shadow-paper">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg text-on-surface">Actividad reciente</h2>
            <p className="mt-0.5 font-sans text-xs text-on-surface-variant">
              Últimas sugerencias generadas para los viajeros.
            </p>
          </div>
          <Badge color="dorado">{datos.recientes.length} registros</Badge>
        </div>
        <Table<RecomendacionAdmin>
          columnas={[
            { clave: 'cliente', encabezado: 'Viajero' },
            { clave: 'paquete', encabezado: 'Paquete' },
            { clave: 'destino', encabezado: 'Destino' },
            {
              clave: 'puntaje',
              encabezado: 'Afinidad',
              render: (fila) => (
                <span className="font-sans text-sm font-semibold text-primary">
                  {Math.round(Number(fila.puntaje) * 100)}%
                </span>
              ),
            },
            {
              clave: 'aceptada',
              encabezado: 'Estado',
              render: (fila) =>
                fila.aceptada === true ? (
                  <Badge color="bosque">Aceptada</Badge>
                ) : fila.mostrada ? (
                  <Badge color="neutro">Mostrada</Badge>
                ) : (
                  <Badge color="neutro">Generada</Badge>
                ),
            },
            {
              clave: 'generada_en',
              encabezado: 'Fecha',
              render: (fila) => formatearFechaHora(fila.generada_en),
            },
          ]}
          datos={datos.recientes}
          vacio="Todavía no se han generado recomendaciones."
        />
      </section>
    </div>
  )
}
