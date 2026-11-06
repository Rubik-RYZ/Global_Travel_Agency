import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Icono de línea que se dibuja dentro del campo, a la izquierda. */
  icono?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icono, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stamp-sepia"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icono && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stamp-sepia/70">
            {icono}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-md border bg-surface-container-lowest py-3 font-sans text-sm text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-colors placeholder:text-stamp-sepia/50 focus:border-terracotta focus:ring-1 focus:ring-terracotta/40 ${
            icono ? 'pl-10 pr-4' : 'px-4'
          } ${error ? 'border-error' : 'border-parchment-border'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
})
