import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  IconoBillete,
  IconoCasa,
  IconoEdificio,
  IconoFlechaDerecha,
  IconoFuego,
  IconoGlobo,
  IconoLibro,
  IconoMapa,
  IconoRayo,
  IconoReloj,
} from '@/components/ui/Iconos'
import {
  agruparRegiones,
  CARACTERES,
  useCuadernoDestinos,
} from '@/hooks/useCuadernoDestinos'

const ICONO_CARACTER: Record<string, ReactNode> = {
  arqueologico: <IconoEdificio className="h-5 w-5" />,
  cultural: <IconoLibro className="h-5 w-5" />,
  naturaleza: <IconoMapa className="h-5 w-5" />,
  aventura: <IconoRayo className="h-5 w-5" />,
  gastronomico: <IconoFuego className="h-5 w-5" />,
  descanso: <IconoCasa className="h-5 w-5" />,
}

interface Props {
  onNavegar?: () => void
}

/**
 * Mega-menú "Cuaderno de Destinos" (#13): tres columnas — por región, por
 * carácter de viaje y un destino destacado del mes. Alimentado con el catálogo
 * real (`/api/v1/destinos/`).
 */
export function MenuCuaderno({ onNavegar }: Props) {
  const destinos = useCuadernoDestinos()
  const regiones = agruparRegiones(destinos)
  const destacado = destinos.find((d) => d.destacado) ?? destinos[0]

  return (
    <div className="pointer-events-auto w-full overflow-hidden rounded-xl border border-parchment-border/70 bg-surface/95 p-5 shadow-paper-lg backdrop-blur-2xl lg:p-8">
      {/* Coordenadas de archivo en la esquina */}
      <div className="mb-4 flex items-center justify-end gap-1.5 text-stamp-sepia">
        <IconoGlobo className="h-3.5 w-3.5 text-primary" />
        <span className="coord">Cuaderno N.º XII · Archivo de rutas</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ── Columna 1: por región ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="etiqueta-seccion text-primary">Por región</span>
          </div>
          <ul className="flex flex-col gap-1">
            {regiones.map((r) => (
              <li key={r.clave}>
                <Link
                  to={`/destinos?region=${r.clave}`}
                  onClick={onNavegar}
                  className="group flex items-start justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-container-low"
                >
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-lg text-on-surface transition-colors group-hover:text-primary">
                        {r.nombre}
                      </span>
                      <span className="coord">
                        {String(r.rutas).padStart(2, '0')} rutas
                      </span>
                    </div>
                    <p className="mt-0.5 font-sans text-xs leading-snug text-on-surface-variant">
                      {r.muestra}
                    </p>
                  </div>
                  <IconoFlechaDerecha className="mt-1.5 h-4 w-4 shrink-0 text-outline transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Columna 2: por experiencia ────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
            <span className="etiqueta-seccion text-secondary-container">
              Por experiencia
            </span>
          </div>
          <ul className="flex flex-col gap-0.5">
            {CARACTERES.map((c) => (
              <li key={c.clave}>
                <Link
                  to={`/destinos?caracter=${c.clave}`}
                  onClick={onNavegar}
                  className="group flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-terracotta transition-colors group-hover:text-primary">
                      {ICONO_CARACTER[c.clave] ?? <IconoGlobo className="h-5 w-5" />}
                    </span>
                    <span className="font-sans text-sm font-medium text-on-surface transition-colors group-hover:text-primary">
                      {c.nombre}
                    </span>
                  </span>
                  <IconoFlechaDerecha className="h-4 w-4 shrink-0 text-outline transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
            <IconoGlobo className="h-4 w-4 shrink-0 text-primary" />
            <span className="coord">
              Grupos reducidos · máximo 8 expedicionarios
            </span>
          </div>
        </div>

        {/* ── Columna 3: destino destacado del mes ──────────────────────── */}
        <div className="lg:col-span-4">
          {destacado ? (
            <div className="group flex h-full flex-col justify-between overflow-hidden rounded-xl bg-surface-container p-4">
              <div>
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg shadow-sm">
                  <img
                    src={destacado.imagen_principal ?? '/assets/destino-1.jpg'}
                    alt={destacado.nombre}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded bg-surface/90 px-2 py-0.5 backdrop-blur-md">
                    <span className="coord font-semibold text-primary">
                      Destino de autor del mes
                    </span>
                  </span>
                  {(destacado.latitud || destacado.longitud) && (
                    <span className="absolute bottom-2 right-2 rounded bg-inverse-surface/80 px-2 py-0.5 font-sans text-[10px] text-inverse-on-surface">
                      {formatearCoordenada(destacado.latitud, 'S', 'N')} ·{' '}
                      {formatearCoordenada(destacado.longitud, 'W', 'E')}
                    </span>
                  )}
                </div>
                <span className="coord text-primary uppercase">
                  {destacado.caracter_display ?? 'Inmersión privada'}
                </span>
                <h3 className="mt-1 font-display text-lg leading-snug text-on-surface">
                  {destacado.pais}: {destacado.nombre}
                </h3>
                <p className="mt-1 font-sans text-xs leading-relaxed text-on-surface-variant">
                  {destacado.resumen ?? destacado.caracter_display ?? ''}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-tertiary">
                  {destacado.duracion_dias && (
                    <span className="flex items-center gap-1">
                      <IconoReloj className="h-3.5 w-3.5" />
                      <span className="coord text-tertiary">
                        {destacado.duracion_dias} días
                      </span>
                    </span>
                  )}
                  {destacado.precio_desde && (
                    <span className="flex items-center gap-1">
                      <IconoBillete className="h-3.5 w-3.5" />
                      <span className="coord text-tertiary">
                        desde {formatearPrecio(destacado.precio_desde, destacado.moneda)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/destinos/${destacado.id}`}
                onClick={onNavegar}
                className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:text-terracotta"
              >
                Explorar dossier completo
                <IconoFlechaDerecha className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl bg-surface-container p-6">
              <span className="coord">Cargando el atlas…</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-surface-container-high pt-3">
        <span className="coord">
          {destinos.length > 0
            ? `${destinos.length} enclaves en el archivo`
            : 'Atlas en preparación'}
        </span>
        <Link
          to="/destinos"
          onClick={onNavegar}
          className="inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant transition-colors hover:text-primary"
        >
          Ver todo el atlas
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

/** 13.163141 → 13°10′S */
function formatearCoordenada(valor: string | null, negativo: string, positivo: string) {
  if (!valor) return '—'
  const n = parseFloat(valor)
  if (Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  const grados = Math.floor(abs)
  const minutos = Math.round((abs - grados) * 60)
  return `${grados}°${String(minutos).padStart(2, '0')}′${n < 0 ? negativo : positivo}`
}

function formatearPrecio(valor: string, moneda: string) {
  const n = Number(valor)
  if (Number.isNaN(n)) return valor
  const simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'Bs '
  return `${simbolo}${n.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
}
