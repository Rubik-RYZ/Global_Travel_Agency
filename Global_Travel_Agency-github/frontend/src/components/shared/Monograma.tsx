interface MonogramaProps {
  nombre: string

  tamano?: 'sm' | 'md' | 'lg'

  foto?: string | null
  className?: string
}

const tamanos = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-24 w-24 text-3xl',
}

function inicialesDe(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function Monograma({
  nombre,
  tamano = 'md',
  foto,
  className = '',
}: MonogramaProps) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        className={`inline-block shrink-0 rounded-full border border-terracotta/30 object-cover ring-1 ring-inset ring-white/40 ${tamanos[tamano]} ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-terracotta/30 bg-terracotta/10 font-display font-semibold text-primary ring-1 ring-inset ring-white/40 ${tamanos[tamano]} ${className}`}
    >
      {inicialesDe(nombre) || '·'}
    </span>
  )
}
