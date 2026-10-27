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
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)
