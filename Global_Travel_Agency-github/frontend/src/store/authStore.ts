/** Estado global de sesión (token + usuario). */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { tokenStorage } from '@/lib/storage'
import type { Usuario } from '@/types/auth.types'

interface AuthState {
  usuario: Usuario | null
  setSesion: (usuario: Usuario, access: string, refresh?: string) => void
  setUsuario: (usuario: Usuario) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      setSesion: (usuario, access, refresh) => {
        tokenStorage.set(access, refresh)
        set({ usuario })
      },
      setUsuario: (usuario) => set({ usuario }),
      logout: () => {
        tokenStorage.clear()
        set({ usuario: null })
      },
    }),
    {
      name: 'illimani-auth',
      // Si cambia la forma del usuario persistido subimos la versión: el estado
      // viejo se descarta y `/auth/me` vuelve a hidratar la sesión, de modo que
      // un `usuario` rancio (sin `foto_url`, con rol viejo...) no se congele.
      version: 1,
      migrate: (persistido, version) => {
        if (version < 1) return { usuario: null }
        return persistido as { usuario: Usuario | null }
      },
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)
