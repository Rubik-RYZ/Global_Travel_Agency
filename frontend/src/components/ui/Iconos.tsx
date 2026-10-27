import type { SVGProps } from 'react'

/**
 * Set de iconos de línea de la casa.
 *
 * Trazo fino (1.5) y remates redondeados, coherentes con el aire editorial
 * de imprenta de `design.md`. Todos aceptan `className` para fijar el tamaño.
 */

type Props = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconoSobre({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8" />
      <path d="M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
    </svg>
  )
}

export function IconoCandado({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <path d="M12 15v2" />
      <path d="M18 21H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z" />
      <path d="M16 11V7a4 4 0 0 0-8 0v4" />
    </svg>
  )
}

export function IconoGlobo({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 3.9 9 14.5 14.5 0 0 1-3.9 9 14.5 14.5 0 0 1-3.9-9A14.5 14.5 0 0 1 12 3z" />
    </svg>
  )
}

export function IconoChevron({ className = 'h-3 w-3', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconoEscudo({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <path d="M9 12l2 2 4-4" />
      <path d="M12 3l7 3v6c0 4.5-3 8.3-7 9.6C8 20.3 5 16.5 5 12V6l7-3z" />
    </svg>
  )
}

export function IconoPuerta({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14v2" />
    </svg>
  )
}

export function IconoPasaporte({ className = 'h-4 w-4', ...props }: Props) {
  return (
    <svg {...base} aria-hidden className={className} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M9 17h6" />
    </svg>
  )
}
