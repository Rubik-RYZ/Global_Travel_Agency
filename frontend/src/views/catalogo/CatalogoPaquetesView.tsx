import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { catalogoApi, type DestinoResumen, type Paquete } from '@/api/catalogo'
import {
  IconoCalendario,
  IconoFlechaDerecha,
  IconoLupa,
  IconoMapa,
  IconoReloj,
  IconoSello,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

function dinero(valor: string, moneda: string): string {
  const n = Number(valor)
  if (Number.isNaN(n)) return `${moneda} —`
  return `${moneda} ${n.toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function proximaSalida(paquete: Paquete): string | null {
  const fechas = paquete.salidas
    .filter((s) => s.cupos_disponibles > 0)
    .map((s) => s.fecha_salida)
    .sort()
  return fechas[0] ?? null
}

/** 23. Viajes · Catálogo público de paquetes → /viajes */
export function CatalogoPaquetesView() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [destinoFiltro, setDestinoFiltro] = useState('')

  useEffect(() => {
    let activo = true
    async function cargarDestinos() {
      try {
        const data = await catalogoApi.listarDestinos()
        if (activo) setDestinos(data.results)
      } catch {
        // El filtro por destino es opcional; la lista de viajes manda.
      }
    }
    void cargarDestinos()
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const acc: Paquete[] = []
        let pagina = 1
        for (;;) {
          const data = await catalogoApi.listarPaquetes({ page: pagina })
          acc.push(...data.results)
          if (!data.next) break
          pagina += 1
        }
        if (activo) setPaquetes(acc)
      } catch (e) {
        if (activo) setError(mensajeDeError(e))
      } finally {
        if (activo) setCargando(false)
      }
    }
    void cargar()
    return () => {
      activo = false
    }
  }, [])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return paquetes.filter((p) => {
      if (destinoFiltro && p.destino !== Number(destinoFiltro)) return false
      if (!texto) return true
      return (
        p.nombre.toLowerCase().includes(texto) ||
        p.destino_nombre.toLowerCase().includes(texto) ||
        (p.descripcion ?? '').toLowerCase().includes(texto) ||
        p.etiquetas.some((e) => e.toLowerCase().includes(texto))
      )
    })
  }, [paquetes, busqueda, destinoFiltro])

  const imagenPorDestino = useMemo(() => {
    const mapa = new Map<number, string | null>()
    for (const d of destinos) mapa.set(d.id, d.imagen_principal)
    return mapa
  }, [destinos])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="coord flex items-center gap-2 text-terracotta">
            <span className="regla-terracotta" />
            Cuaderno de viajes · CU6
          </span>
          <span className="coord flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            Itinerarios curados por el atelier
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
            Viajes preparados para partir
          </h1>
          <p className="max-w-2xl font-display text-lg font-normal italic text-on-surface-variant">
            Paquetes con destino, hospedaje y fechas de salida confirmadas por la
            agencia. Elija su próxima travesía.
          </p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4 shadow-paper sm:flex-row sm:items-end"
        >
          <label className="flex w-full flex-col gap-1.5 sm:w-2/5">
            <span className="coord">Buscar viaje</span>
            <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5">
              <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, destino o etiqueta..."
                className="w-full bg-transparent font-sans text-sm text-ink-warm outline-none placeholder:text-stamp-sepia/60"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Destino</span>
            <select
              value={destinoFiltro}
              onChange={(e) => setDestinoFiltro(e.target.value)}
              className="min-w-48 cursor-pointer rounded-md border border-outline-variant/60 bg-surface px-3 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Todos los destinos</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
        </form>
      </header>

      {error && (
        <p className="mt-8 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      <section className="mt-10">
        {cargando ? (
          <p className="nota-manuscrita">Preparando el cuaderno de viajes...</p>
        ) : visibles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">
              No hay viajes para esa búsqueda
            </p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Pruebe con otro destino o limpie los filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((paquete) => {
              const salida = proximaSalida(paquete)
              const imagen = imagenPorDestino.get(paquete.destino) ?? null
              return (
                <article
                  key={paquete.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper transition-shadow hover:shadow-paper-lg"
                >
                  <div className="relative h-44 overflow-hidden bg-surface-container">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={paquete.destino_nombre}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="textura-carta absolute inset-0 opacity-70" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-forest-night/85 to-transparent px-5 pb-3 pt-10">
                      <span className="coord flex items-center gap-1.5 text-surface">
                        <IconoMapa className="h-3.5 w-3.5" />
                        {paquete.destino_nombre}
                      </span>
                      <span className="coord text-surface/80">
                        {paquete.duracion_dias} días
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="font-display text-2xl leading-snug text-on-surface">
                        {paquete.nombre}
                      </h2>
                      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
                        {paquete.descripcion ||
                          'Una travesía preparada por el atelier de viajes.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {paquete.etiquetas.map((etiqueta) => (
                        <span
                          key={etiqueta}
                          className="rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary"
                        >
                          {etiqueta}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-2 border-t border-parchment-border/60 pt-4">
                      {paquete.hotel_nombre && (
                        <span className="font-sans text-xs text-on-surface-variant">
                          Hospedaje · {paquete.hotel_nombre}
                        </span>
                      )}
                      <span className="coord flex items-center gap-1.5">
                        <IconoCalendario className="h-3.5 w-3.5 text-terracotta" />
                        {salida
                          ? `Próxima salida · ${fechaCorta(salida)}`
                          : 'Fechas por confirmar'}
                      </span>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="font-display text-xl text-primary">
                          {dinero(paquete.precio_base, paquete.moneda)}
                          <span className="ml-1 font-sans text-[11px] uppercase tracking-wider text-on-surface-variant">
                            por persona
                          </span>
                        </span>
                        <Link
                          to={`/viajes/${paquete.id}`}
                          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-terracotta"
                        >
                          Ver viaje
                          <IconoFlechaDerecha className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {!cargando && visibles.length > 0 && (
        <p className="mt-8 flex items-center justify-center gap-2 coord text-stamp-sepia">
          <IconoReloj className="h-3.5 w-3.5" />
          {visibles.length} viajes disponibles en el cuaderno
        </p>
      )}
    </div>
  )
}