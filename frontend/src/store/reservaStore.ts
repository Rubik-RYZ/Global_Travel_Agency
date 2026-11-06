/**
 * Estado del flujo multi-paso de reserva (CU7).
 * Conserva el progreso entre Selección (#27) -> Pasajeros (#28) -> Confirmación (#29).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Pasajero, Reserva } from '@/types/reserva.types'

interface ReservaFlowState {
  paqueteId: number | null
  salidaId: number | null
  numPersonas: number
  pasajeros: Pasajero[]
  reservaConfirmada: Reserva | null

  setPaquete: (paqueteId: number, salidaId: number) => void
  setPersonas: (numPersonas: number) => void
  setPasajeros: (pasajeros: Pasajero[]) => void
  setReservaConfirmada: (reserva: Reserva | null) => void
  reset: () => void
}

export const useReservaStore = create<ReservaFlowState>()(
  persist(
    (set) => ({
      paqueteId: null,
      salidaId: null,
      numPersonas: 1,
      pasajeros: [],
      reservaConfirmada: null,

      setPaquete: (paqueteId, salidaId) => set({ paqueteId, salidaId }),
      setPersonas: (numPersonas) => set({ numPersonas }),
      setPasajeros: (pasajeros) => set({ pasajeros }),
      setReservaConfirmada: (reserva) => set({ reservaConfirmada: reserva }),
      reset: () =>
        set({
          paqueteId: null,
          salidaId: null,
          numPersonas: 1,
          pasajeros: [],
          reservaConfirmada: null,
        }),
    }),
    {
      name: 'illimani_reserva_flow',
    }
  )
)
