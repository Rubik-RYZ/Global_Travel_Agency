/** Guardas de ruta: exigen sesión y, opcionalmente, un rol concreto. */
import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { tokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
import { ROLES, type RolNombre } from '@/utils/roles'

function useRestaurarSesion() {
  const usuario = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)
  const limpiar = useAuthStore((s) => s.logout)
  // Si hay token pero aún no hay usuario restaurado, arrancamos en «cargando»
  // para no expulsar a /login durante el primer render (recarga profunda).
  const [cargando, setCargando] = useState(() => !usuario && !!tokenStorage.getAccess())
  const intentado = useRef(false)

  useEffect(() => {
    // Una sola restauración por montaje: el doble efecto de StrictMode no debe
    // disparar dos `/auth/me` ni cancelar la promesa en curso.
    if (intentado.current) return
    if (usuario || !tokenStorage.getAccess()) return

    intentado.current = true
    authApi
      .me()
      .then(setUsuario)
      .catch(limpiar)
      .finally(() => setCargando(false))
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
        <span className="nota-manuscrita text-stamp-sepia">Verificando credenciales...</span>
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

/** Solo cliente (área privada «Mi viaje»). */
export function RutaCliente() {
  return <RutaProtegida roles={[ROLES.CLIENTE]} />
}