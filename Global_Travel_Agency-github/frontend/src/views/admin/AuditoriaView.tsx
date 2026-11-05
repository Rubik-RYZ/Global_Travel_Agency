import { useEffect, useState } from 'react'

import { authApi } from '@/api/auth'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { IconoLupa, IconoPortapapeles } from '@/components/ui/Iconos'
import { Input } from '@/components/ui/Input/Input'
import type { Auditoria } from '@/types/auth.types'
import { formatearFechaHora } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'

type ColorAccion = 'terracota' | 'bosque' | 'dorado' | 'neutro'

function colorDeAccion(accion: string): ColorAccion {
  if (accion.startsWith('login_fallido')) return 'terracota'
  if (accion === 'login') return 'bosque'
  if (accion === 'logout') return 'neutro'
  return 'dorado'
}

function etiquetaAccion(accion: string): string {
  return accion.replace(/_/g, ' ')
}

/** 9. Panel · Bitácora de seguridad → /admin/auditoria */
export function AuditoriaView() {
  const [eventos, setEventos] = useState<Auditoria[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [haySiguiente, setHaySiguiente] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)
    authApi
      .auditoria({ page: pagina, search: busqueda || undefined })
      .then((data) => {
        if (!activo) return
        setEventos(data.results)
        setTotal(data.count)
        setHaySiguiente(Boolean(data.next))
      })
      .catch((e) => activo && setError(mensajeDeError(e)))
      .finally(() => activo && setCargando(false))
    return () => { activo = false }
  }, [pagina, busqueda])

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="regla-terracota" />
          <p className="etiqueta-seccion">Panel · Seguridad</p>
        </div>
        <h1 className="mt-3 font-display text-4xl text-on-surface">Bitácora de seguridad</h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Registro cronológico de accesos, intentos fallidos y cambios relevantes.
        </p>
      </header>

      {/* Barra de búsqueda + contador */}
      <section className="mb-6 overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
        <div className="grid gap-4 border-b border-parchment-border/70 bg-surface-container-low px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input
            label="Buscar en la bitácora"
            placeholder="Acción, entidad o identificador…"
            icono={<IconoLupa className="h-4 w-4" />}
            value={busqueda}
            onChange={(e) => { setPagina(1); setBusqueda(e.target.value) }}
          />
          <p className="coord sm:pb-2.5">
            {total} {total === 1 ? 'evento' : 'eventos'}
          </p>
        </div>
      </section>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="nota-manuscrita text-stamp-sepia">Abriendo el libro de actas…</p>
      ) : eventos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-parchment-border px-6 py-16 text-center">
          <p className="font-display text-xl text-on-surface">Sin eventos registrados</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {eventos.map((e) => (
            <EventoFila key={e.id} evento={e} />
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variante="ghost" tamano="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
          ← Anterior
        </Button>
        <span className="coord">Página {pagina}</span>
        <Button variante="ghost" tamano="sm" disabled={!haySiguiente} onClick={() => setPagina((p) => p + 1)}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function EventoFila({ evento }: { evento: Auditoria }) {
  return (
    <li className="overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-parchment-border/70 bg-surface-container-low px-5 py-2">
        <span className="flex items-center gap-1.5">
          <IconoPortapapeles className="h-3.5 w-3.5 text-terracotta" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Folio #{evento.id}
          </span>
        </span>
        <span className="coord">{formatearFechaHora(evento.creado_en)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge color={colorDeAccion(evento.accion)}>{etiquetaAccion(evento.accion)}</Badge>
          <span className="font-sans text-sm text-on-surface">
            {evento.usuario_email ?? '— anónimo'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {evento.entidad && (
            <span className="font-sans text-xs text-on-surface-variant">
              {evento.entidad}
              {evento.entidad_id ? ` · ${evento.entidad_id}` : ''}
            </span>
          )}
          {evento.ip && (
            <span className="font-mono text-xs text-on-surface-variant">{evento.ip}</span>
          )}
        </div>
      </div>
    </li>
  )
}
