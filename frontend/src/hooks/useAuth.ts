/** Hook de sesión: login, registro, logout y refresco de perfil (CU1). */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { tokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
import type { RegistroPayload } from '@/types/auth.types'

export function useAuth() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const setSesion = useAuthStore((s) => s.setSesion)
  const setUsuario = useAuthStore((s) => s.setUsuario)
  const limpiar = useAuthStore((s) => s.logout)

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password)
      setSesion(data.usuario, data.access, data.refresh)
      return data.usuario
    },
    [setSesion],
  )

  const registrar = useCallback(
    async (payload: RegistroPayload) => {
      const data = await authApi.registro(payload)
      setSesion(data.usuario, data.access, data.refresh)
      return data.usuario
    },
    [setSesion],
  )

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout(tokenStorage.getRefresh())
    } catch {
      // La sesión se cierra localmente aunque el token ya no sea válido.
    }
    limpiar()
    navigate('/login', { replace: true })
  }, [limpiar, navigate])

  const refrescarPerfil = useCallback(async () => {
    const data = await authApi.me()
    setUsuario(data)
    return data
  }, [setUsuario])

  return { usuario, iniciarSesion, registrar, cerrarSesion, refrescarPerfil }
}
