/** Estado del flujo multi-paso de reserva (se implementa en el Sprint 4). */
import { create } from 'zustand'

interface ReservaFlowState {
  paqueteId: number | null
  salidaId: number | null
  numPersonas: number
  setPaquete: (paqueteId: number, salidaId: number) => void
  setPersonas: (numPersonas: number) => void
  reset: () => void
}

export const useReservaStore = create<ReservaFlowState>((set) => ({
  paqueteId: null,
  salidaId: null,
  numPersonas: 1,
  setPaquete: (paqueteId, salidaId) => set({ paqueteId, salidaId }),
  setPersonas: (numPersonas) => set({ numPersonas }),
  reset: () => set({ paqueteId: null, salidaId: null, numPersonas: 1 }),
}))
