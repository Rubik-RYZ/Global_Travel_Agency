import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { iaApi } from '@/api/ia'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import {
  IconoBasura,
  IconoChat,
  IconoEtiqueta,
  IconoLibro,
  IconoLupa,
  IconoMas,
  IconoPlay,
  IconoRayo,
  IconoSello,
} from '@/components/ui/Iconos'
import type { FraseIA, IntencionIA, PanelEntrenamiento } from '@/types/ia.types'
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

function metrica(panel: PanelEntrenamiento, clave: string): string {
  const valor = panel.modelo_activo?.metricas?.[clave]
  if (valor === null || valor === undefined) return '—'
  return typeof valor === 'number' ? String(valor) : String(valor)
}

/** 41. Panel · Entrenamiento del asistente → /admin/asistente-ia */
export function AsistenteIAAdminView() {
  const [panel, setPanel] = useState<PanelEntrenamiento | null>(null)
  const [seleccionId, setSeleccionId] = useState<number | null>(null)
  const [frases, setFrases] = useState<FraseIA[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [textoFrase, setTextoFrase] = useState('')
  const [nuevaIntencion, setNuevaIntencion] = useState('')
  const [descripcionIntencion, setDescripcionIntencion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [cargandoFrases, setCargandoFrases] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargarPanel = useCallback(async () => {
    const datos = await iaApi.panelEntrenamiento()
    setPanel(datos)
    setSeleccionId((actual) => actual ?? datos.intenciones[0]?.id ?? null)
    return datos
  }, [])

  const cargarFrases = useCallback(
    async (intencionId: number, texto = '') => {
      setCargandoFrases(true)
      try {
        const datos = await iaApi.frases.listar({
          intencion: intencionId,
          q: texto.trim() || undefined,
        })
        setFrases(datos)
      } finally {
        setCargandoFrases(false)
      }
    },
    [],
  )

  useEffect(() => {
    let activo = true
    setCargando(true)
    cargarPanel()
      .catch((e) => {
        if (activo) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [cargarPanel])

  useEffect(() => {
    if (seleccionId === null) {
      setFrases([])
      return
    }
    let activo = true
    void cargarFrases(seleccionId, busqueda).catch((e) => {
      if (activo) setError(mensajeDeError(e))
    })
    return () => {
      activo = false
    }
  }, [seleccionId, busqueda, cargarFrases])

  const seleccionada =
    panel?.intenciones.find((intencion) => intencion.id === seleccionId) ?? null

  const ejecutar = async (accion: () => Promise<void>, mensajeOk?: string) => {
    setTrabajando(true)
    setError(null)
    setAviso(null)
    try {
      await accion()
      if (mensajeOk) setAviso(mensajeOk)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setTrabajando(false)
    }
  }

  const reentrenar = () =>
    ejecutar(async () => {
      const datos = await iaApi.reentrenar()
      setPanel(datos)
    }, 'Clasificador reentrenado con las frases vigentes.')

  const crearIntencion = () =>
    ejecutar(async () => {
      const nombre = nuevaIntencion.trim().toLowerCase().replace(/\s+/g, '_')
      if (!nombre) throw new Error('Escriba un nombre para la intención.')
      const creada = await iaApi.intenciones.crear({
        nombre,
        descripcion: descripcionIntencion.trim() || null,
        activa: true,
      })
      setNuevaIntencion('')
      setDescripcionIntencion('')
      const datos = await cargarPanel()
      setSeleccionId(creada.id)
      if (datos) await cargarFrases(creada.id)
    }, 'Intención creada y clasificador reentrenado.')

  const alternarIntencion = (intencion: IntencionIA) =>
    ejecutar(async () => {
      await iaApi.intenciones.actualizar(intencion.id, {
        activa: !intencion.activa,
      })
      await cargarPanel()
    }, intencion.activa ? 'Intención desactivada.' : 'Intención activada.')

  const eliminarIntencion = (intencion: IntencionIA) => {
    if (
      !window.confirm(
        `¿Eliminar la intención "${intencion.nombre}" y sus ${intencion.total_frases} frases?`,
      )
    ) {
      return
    }
    void ejecutar(async () => {
      await iaApi.intenciones.eliminar(intencion.id)
      setSeleccionId(null)
      const datos = await cargarPanel()
      setSeleccionId(datos.intenciones[0]?.id ?? null)
    }, 'Intención eliminada y clasificador reentrenado.')
  }

  const agregarFrase = () => {
    if (!seleccionId || !textoFrase.trim()) return
    void ejecutar(async () => {
      await iaApi.frases.crear({
        intencion: seleccionId,
        texto: textoFrase.trim(),
      })
      setTextoFrase('')
      await cargarFrases(seleccionId, busqueda)
      await cargarPanel()
    }, 'Frase agregada y clasificador reentrenado.')
  }

  const eliminarFrase = (frase: FraseIA) => {
    if (!window.confirm('¿Eliminar esta frase de entrenamiento?')) return
    void ejecutar(async () => {
      await iaApi.frases.eliminar(frase.id)
      await cargarFrases(frase.intencion, busqueda)
      await cargarPanel()
    }, 'Frase eliminada y clasificador reentrenado.')
  }

  if (cargando) {
    return (
      <p className="nota-manuscrita text-stamp-sepia">
        Abriendo el cuaderno de entrenamiento...
      </p>
    )
  }

  if (!panel) {
    return <ErrorNota texto={error ?? 'No se pudo cargar el panel del asistente.'} />
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-parchment-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="coord inline-flex items-center gap-2 text-terracotta">
            <IconoRayo className="h-4 w-4" />
            CU10 · Asistente conversacional
          </span>
          <h1 className="mt-3 font-display text-3xl leading-tight text-on-surface sm:text-4xl">
            Entrenamiento del asistente
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant">
            Administre las intenciones y frases que alimentan el clasificador.
            Cada cambio reentrena el modelo y deja una nueva versión activa.
          </p>
        </div>
        <Button onClick={() => void reentrenar()} disabled={trabajando}>
          <IconoPlay className="h-4 w-4" />
          {trabajando ? 'Entrenando...' : 'Reentrenar ahora'}
        </Button>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Intenciones"
          valor={panel.intenciones.length}
          detalle={`${panel.intenciones.filter((i) => i.activa).length} activas`}
          icono={<IconoLibro className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Frases"
          valor={panel.frases_total}
          detalle="Catálogo de entrenamiento"
          icono={<IconoEtiqueta className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Conversaciones"
          valor={panel.conversaciones_total}
          detalle={`${panel.mensajes_total} mensajes guardados`}
          icono={<IconoChat className="h-4 w-4" />}
        />
        <Kpi
          etiqueta="Precisión entrenamiento"
          valor={metrica(panel, 'precision_entrenamiento')}
          detalle={
            panel.modelo_activo
              ? `Versión ${panel.modelo_activo.version}`
              : 'Sin modelo activo'
          }
          icono={<IconoSello className="h-4 w-4" />}
        />
      </div>

      {error && <ErrorNota texto={error} />}
      {aviso && (
        <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-4 py-2.5 font-sans text-xs text-tertiary">
          {aviso}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-4 shadow-paper">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-on-surface">Intenciones</h2>
              <span className="coord">{panel.intenciones.length}</span>
            </div>

            <div className="mt-3 max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
              {panel.intenciones.map((intencion) => {
                const activa = intencion.id === seleccionId
                return (
                  <button
                    key={intencion.id}
                    type="button"
                    onClick={() => setSeleccionId(intencion.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                      activa
                        ? 'border-terracotta/60 bg-terracotta/10'
                        : 'border-transparent hover:border-parchment-border hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-medium text-on-surface">
                        {intencion.nombre}
                      </span>
                      <span className="block font-sans text-[10px] uppercase tracking-wider text-stamp-sepia">
                        {intencion.total_frases} frases
                      </span>
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        intencion.activa ? 'bg-secondary' : 'bg-outline-variant'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-4 shadow-paper">
            <h2 className="font-display text-lg text-on-surface">Nueva intención</h2>
            <div className="mt-3 space-y-3">
              <Input
                label="Nombre técnico"
                placeholder="ej. consultar_seguro"
                value={nuevaIntencion}
                onChange={(evento) => setNuevaIntencion(evento.target.value)}
              />
              <Input
                label="Descripción"
                placeholder="¿Qué pide el viajero?"
                value={descripcionIntencion}
                onChange={(evento) => setDescripcionIntencion(evento.target.value)}
              />
              <Button
                tamano="sm"
                onClick={() => void crearIntencion()}
                disabled={trabajando || !nuevaIntencion.trim()}
                className="w-full"
              >
                <IconoMas className="h-4 w-4" />
                Crear intención
              </Button>
            </div>
          </section>
        </aside>

        <section className="rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
          {seleccionada ? (
            <>
              <header className="flex flex-col gap-3 border-b border-parchment-border bg-surface-container-low px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="coord">Intención seleccionada</p>
                  <h2 className="mt-1 font-display text-2xl text-on-surface">
                    {seleccionada.nombre}
                  </h2>
                  <p className="mt-1 font-sans text-sm text-on-surface-variant">
                    {seleccionada.descripcion ?? 'Sin descripción.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variante="ghost"
                    tamano="sm"
                    onClick={() => void alternarIntencion(seleccionada)}
                    disabled={trabajando}
                  >
                    {seleccionada.activa ? 'Desactivar' : 'Activar'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => eliminarIntencion(seleccionada)}
                    disabled={trabajando}
                    className="inline-flex items-center gap-1.5 rounded-full border border-error/40 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-error transition-colors hover:bg-error-container/40 disabled:opacity-50"
                  >
                    <IconoBasura className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </header>

              <div className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="Agregar frase de entrenamiento"
                    placeholder="Ej. Quiero viajar a la playa en julio"
                    value={textoFrase}
                    onChange={(evento) => setTextoFrase(evento.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={agregarFrase}
                    disabled={trabajando || !textoFrase.trim()}
                  >
                    <IconoMas className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-parchment-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="relative flex-1">
                    <span className="sr-only">Buscar frases</span>
                    <IconoLupa className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stamp-sepia" />
                    <input
                      value={busqueda}
                      onChange={(evento) => setBusqueda(evento.target.value)}
                      placeholder="Buscar en las frases de esta intención..."
                      className="w-full rounded-md border border-parchment-border bg-surface-container-lowest py-2.5 pl-9 pr-3 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/70 focus:border-terracotta"
                    />
                  </label>
                  <span className="coord">
                    {cargandoFrases ? 'Cargando...' : `${frases.length} frases`}
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-parchment-border/70">
                  {frases.map((frase) => (
                    <li
                      key={frase.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-sans text-sm text-on-surface">{frase.texto}</p>
                        <p className="mt-0.5 font-sans text-[10px] uppercase tracking-wider text-stamp-sepia">
                          {frase.origen} · {formatearFechaHora(frase.creado_en)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Eliminar frase: ${frase.texto}`}
                        onClick={() => eliminarFrase(frase)}
                        disabled={trabajando}
                        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container/40 disabled:opacity-50"
                      >
                        <IconoBasura className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  {!cargandoFrases && frases.length === 0 && (
                    <li className="py-8 text-center font-sans text-xs text-stamp-sepia">
                      No hay frases que coincidan con la búsqueda.
                    </li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <p className="nota-manuscrita text-stamp-sepia">
                Cree o seleccione una intención para editar sus frases.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ErrorNota({ texto }: { texto: string }) {
  return (
    <p className="mt-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
      {texto}
    </p>
  )
}
