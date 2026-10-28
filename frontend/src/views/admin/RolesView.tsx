import { useCallback, useEffect, useState } from 'react'

import { authApi } from '@/api/auth'
import { Monograma } from '@/components/shared/Monograma'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { IconoEscudo, IconoLapiz, IconoMas } from '@/components/ui/Iconos'
import type { Rol, UsuarioEquipo } from '@/types/auth.types'
import { formatearFecha, formatearFechaHora } from '@/utils/formatters'
import { etiquetaRol } from '@/utils/roles'
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

  useEffect(() => { void cargar() }, [cargar])

  const abrirNuevo = () => { setEnEdicion(null); setModalAbierto(true) }
  const abrirEdicion = (u: UsuarioEquipo) => { setEnEdicion(u); setModalAbierto(true) }

  const desactivar = async (u: UsuarioEquipo) => {
    if (!window.confirm(`¿Desactivar el acceso de ${u.email}?`)) return
    try { await authApi.desactivarUsuario(u.id); await cargar() }
    catch (e) { setError(mensajeDeError(e)) }
  }

  const activos = usuarios.filter((u) => u.activo).length

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="regla-terracota" />
            <p className="etiqueta-seccion">Panel · Seguridad</p>
          </div>
          <h1 className="mt-3 font-display text-4xl text-on-surface">Equipo y accesos</h1>
          <p className="mt-2 font-sans text-sm text-on-surface-variant">
            Cuentas internas, roles y estado de acceso al sistema.
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <IconoMas className="h-4 w-4" />
          Nuevo acceso
        </Button>
      </header>

      {/* Cifras rápidas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-parchment-border bg-surface-container-lowest px-5 py-4 shadow-paper">
          <p className="coord">Total cuentas</p>
          <p className="mt-1 font-display text-3xl leading-none text-primary">{usuarios.length}</p>
        </div>
        <div className="rounded-lg border border-parchment-border bg-surface-container-lowest px-5 py-4 shadow-paper">
          <p className="coord">Cuentas activas</p>
          <p className="mt-1 font-display text-3xl leading-none text-primary">{activos}</p>
        </div>
        <div className="rounded-lg border border-parchment-border bg-surface-container-lowest px-5 py-4 shadow-paper">
          <p className="coord">Roles configurados</p>
          <p className="mt-1 font-display text-3xl leading-none text-primary">{roles.length}</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="nota-manuscrita text-stamp-sepia">Consultando padrones…</p>
      ) : usuarios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-parchment-border px-6 py-16 text-center">
          <p className="font-display text-xl text-on-surface">Sin cuentas internas aún</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {usuarios.map((u) => (
            <TarjetaUsuario
              key={u.id}
              usuario={u}
              onEditar={() => abrirEdicion(u)}
              onDesactivar={() => desactivar(u)}
            />
          ))}
        </ul>
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

/* -------------------------------------------------------------------------- */

function TarjetaUsuario({
  usuario,
  onEditar,
  onDesactivar,
}: {
  usuario: UsuarioEquipo
  onEditar: () => void
  onDesactivar: () => void
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b border-parchment-border/70 bg-surface-container-low px-5 py-2.5">
        <span className="flex items-center gap-1.5">
          <IconoEscudo className="h-3.5 w-3.5 text-terracotta" />
          <span className="coord">{etiquetaRol(usuario.rol as 'administrador' | 'agente' | 'cliente')}</span>
        </span>
        <span className="coord">Alta · {formatearFecha(usuario.creado_en)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <Monograma nombre={usuario.email} tamano="sm" />
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-medium text-on-surface">{usuario.email}</p>
            <p className="mt-0.5 font-sans text-xs text-on-surface-variant">
              {usuario.ultimo_acceso
                ? `Último acceso: ${formatearFechaHora(usuario.ultimo_acceso)}`
                : 'Sin accesos registrados'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge color={usuario.rol === 'administrador' ? 'terracota' : 'bosque'}>
            {usuario.rol}
          </Badge>
          <Badge color={usuario.activo ? 'bosque' : 'neutro'}>
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-terracotta hover:text-primary"
          >
            <IconoLapiz className="h-3 w-3" />
            Editar
          </button>
          {usuario.activo && (
            <button
              type="button"
              onClick={onDesactivar}
              className="rounded-full border border-error/30 px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-error transition-colors hover:bg-error-container/40"
            >
              Desactivar
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
