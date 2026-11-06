import type { ReactNode } from 'react'

type Color = 'terracota' | 'bosque' | 'dorado' | 'neutro'

interface BadgeProps {
  color?: Color
  children: ReactNode
}

const colores: Record<Color, string> = {
  terracota: 'border-terracotta/40 bg-terracotta/10 text-primary',
  bosque: 'border-secondary/30 bg-secondary/10 text-secondary',
  dorado: 'border-gold/40 bg-gold/10 text-tertiary',
  neutro: 'border-outline-variant bg-surface-container text-on-surface-variant',
}

export function Badge({ color = 'neutro', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider ${colores[color]}`}
    >
      {children}
    </span>
  )
}
