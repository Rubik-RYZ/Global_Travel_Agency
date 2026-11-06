import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo?: string
  children: ReactNode
  /** Ancho del panel; por defecto `md` (max-w-lg). */
  ancho?: 'sm' | 'md' | 'lg' | 'xl'
}

const ANCHOS: Record<NonNullable<ModalProps['ancho']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
        >
          <motion.div
            className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-parchment-border bg-surface-bright p-6 shadow-paper-lg ${ANCHOS[ancho]}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            {titulo && <h3 className="mb-4 text-2xl">{titulo}</h3>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
