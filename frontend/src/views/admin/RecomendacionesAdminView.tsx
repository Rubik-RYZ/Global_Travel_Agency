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

/** 43. Panel · Calidad de recomendaciones → /admin/recomendaciones */
export function RecomendacionesAdminView() {
  const [datos, setDatos] = useState<PanelRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
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
