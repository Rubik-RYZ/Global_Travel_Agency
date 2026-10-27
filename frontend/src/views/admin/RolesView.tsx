import { useCallback, useEffect, useState } from 'react'

import { authApi } from '@/api/auth'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Table, type Columna } from '@/components/ui/Table/Table'
import type { Rol, UsuarioEquipo } from '@/types/auth.types'
import { formatearFechaHora } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'
import { UsuarioFormModal } from '@/views/admin/components/UsuarioFormModal'

/** 8. Panel · Equipo y accesos → /admin/roles */
export function RolesView() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioEquipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [enEdicion, setEnEdicion] = useState<UsuarioEquipo | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaRoles, paginaUsuarios] = await Promise.all([
        authApi.roles(),
        authApi.usuarios(),
      ])
      setRoles(listaRoles)
      setUsuarios(paginaUsuarios.results)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setEnEdicion(null)
    setModalAbierto(true)
  }

  const abrirEdicion = (usuario: UsuarioEquipo) => {
    setEnEdicion(usuario)
    setModalAbierto(true)
  }

  const desactivar = async (usuario: UsuarioEquipo) => {
    if (!window.confirm(`¿Desactivar el acceso de ${usuario.email}?`)) return
    try {
      await authApi.desactivarUsuario(usuario.id)
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const columnas: Columna<UsuarioEquipo>[] = [
    {
      clave: 'email',
      encabezado: 'Cuenta',
      render: (u) => (
        <div>
          <p className="font-medium text-on-surface">{u.email}</p>
          <p className="font-sans text-xs text-on-surface-variant">
            Alta: {formatearFechaHora(u.creado_en)}
          </p>
        </div>
      ),
    },
    {
      clave: 'rol',
      encabezado: 'Rol',
      render: (u) => <Badge color={u.rol === 'administrador' ? 'terracota' : 'bosque'}>{u.rol}</Badge>,
    },
    {
      clave: 'activo',
      encabezado: 'Estado',
      render: (u) => (
        <Badge color={u.activo ? 'bosque' : 'neutro'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      clave: 'ultimo_acceso',
      encabezado: 'Último acceso',
      render: (u) => (
        <span className="text-on-surface-variant">
          {u.ultimo_acceso ? formatearFechaHora(u.ultimo_acceso) : 'Nunca'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: '',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => abrirEdicion(u)}
            className="rounded-full border border-outline-variant px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-terracotta hover:text-primary"
          >
            Editar
          </button>
          {u.activo && (
            <button
              type="button"
              onClick={() => desactivar(u)}
              className="rounded-full border border-error/30 px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-error transition-colors hover:bg-error-container/40"
            >
              Desactivar
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta-seccion">Panel · Seguridad</p>
          <h1 className="mt-3 font-display text-4xl text-on-surface">Equipo y accesos</h1>
          <p className="mt-2 font-sans text-sm text-on-surface-variant">
            Cuentas internas, roles y estado de acceso al sistema.
          </p>
        </div>
        <Button onClick={abrirNuevo}>Nuevo acceso</Button>
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="nota-manuscrita text-stamp-sepia">Consultando padrones…</p>
      ) : (
        <Table columnas={columnas} datos={usuarios} vacio="Aún no hay cuentas internas." />
      )}

      <UsuarioFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        roles={roles}
        usuario={enEdicion}
        onGuardado={cargar}
      />
    </div>
  )
}