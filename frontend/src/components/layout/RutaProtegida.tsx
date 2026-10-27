/** Guardas de ruta: exigen sesión y, opcionalmente, un rol concreto. */
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { tokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
import { ROLES, type RolNombre } from '@/utils/roles'

function useRestaurarSesion() {
  const usuario = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)
  const limpiar = useAuthStore((s) => s.logout)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    let activo = true
    if (!usuario && tokenStorage.getAccess()) {
      setCargando(true)
      authApi
        .me()
        .then((u) => activo && setUsuario(u))
        .catch(() => activo && limpiar())
        .finally(() => activo && setCargando(false))
    }
    return () => {
      activo = false
    }
  }, [usuario, setUsuario, limpiar])

  return { usuario, cargando }
}

interface RutaProtegidaProps {
  roles?: RolNombre[]
}

export function RutaProtegida({ roles }: RutaProtegidaProps) {
  const ubicacion = useLocation()
  const { usuario, cargando } = useRestaurarSesion()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="nota-manuscrita text-stamp-sepia">Verificando credenciales…</span>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

/** Solo administrador y agente (panel interno). */
export function RutaPanel() {
  return <RutaProtegida roles={[ROLES.ADMINISTRADOR, ROLES.AGENTE]} />
}

/** Solo administrador. */
export function RutaAdmin() {
  return <RutaProtegida roles={[ROLES.ADMINISTRADOR]} />
}
