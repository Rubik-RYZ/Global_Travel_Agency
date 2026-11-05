import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primary' | 'secondary' | 'ghost'
type Tamano = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  children: ReactNode
}

const variantes: Record<Variante, string> = {
  primary: 'bg-terracotta text-white hover:bg-primary-container shadow-paper',
  secondary: 'bg-secondary text-on-secondary hover:bg-secondary-container',
  ghost:
    'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container',
}

const tamanos: Record<Tamano, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function Button({
  variante = 'primary',
  tamano = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
