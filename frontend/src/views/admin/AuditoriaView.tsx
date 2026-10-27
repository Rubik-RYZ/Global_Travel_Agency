import { useEffect, useState } from 'react'

import { authApi } from '@/api/auth'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Table, type Columna } from '@/components/ui/Table/Table'
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
    return () => {
      activo = false
    }
  }, [pagina, busqueda])

  const columnas: Columna<Auditoria>[] = [
    {
      clave: 'creado_en',
      encabezado: 'Fecha',
      render: (e) => (
        <span className="whitespace-nowrap text-on-surface-variant">
          {formatearFechaHora(e.creado_en)}
        </span>
      ),
    },
    {
      clave: 'accion',
      encabezado: 'Acto registrado',
      render: (e) => (
        <div className="flex flex-col gap-1">
          <Badge color={colorDeAccion(e.accion)}>{e.accion.replace(/_/g, ' ')}</Badge>
          <span className="font-mono text-[11px] text-on-surface-variant">folio #{e.id}</span>
        </div>
      ),
    },
    {
      clave: 'usuario_email',
      encabezado: 'Custodio',
      render: (e) => (
        <span className="text-on-surface">{e.usuario_email ?? '— (anónimo)'}</span>
      ),
    },
    {
      clave: 'entidad',
      encabezado: 'Entidad',
      render: (e) =>
        e.entidad ? (
          <span className="text-on-surface-variant">
            {e.entidad}
            {e.entidad_id ? ` · ${e.entidad_id}` : ''}
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      clave: 'ip',
      encabezado: 'Nodo / IP',
      render: (e) => <span className="font-mono text-xs text-on-surface-variant">{e.ip ?? '—'}</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="etiqueta-seccion">Panel · Seguridad</p>
        <h1 className="mt-3 font-display text-4xl text-on-surface">Bitácora de seguridad</h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Registro cronológico de accesos, intentos fallidos y cambios relevantes.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-sm">
          <Input
            label="Buscar en la bitácora"
            placeholder="acción, entidad o identificador…"
            value={busqueda}
            onChange={(e) => {
              setPagina(1)
              setBusqueda(e.target.value)
            }}
          />
        </div>
        <p className="font-sans text-xs uppercase tracking-wider text-on-surface-variant">
          {total} evento{total === 1 ? '' : 's'}
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="nota-manuscrita text-stamp-sepia">Abriendo el libro de actas…</p>
      ) : (
        <Table columnas={columnas} datos={eventos} vacio="No hay eventos registrados." />
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variante="ghost"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
        >
          ← Anterior
        </Button>
        <span className="font-sans text-xs uppercase tracking-wider text-on-surface-variant">
          Página {pagina}
        </span>
        <Button
          variante="ghost"
          tamano="sm"
          disabled={!haySiguiente}
          onClick={() => setPagina((p) => p + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}