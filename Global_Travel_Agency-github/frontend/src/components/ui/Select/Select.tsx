import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface Opcion {
  valor: string | number
  texto: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  opciones: Opcion[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, opciones, placeholder, className = '', id, ...props },
  ref,
) {
  const selectId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`w-full rounded-md border bg-surface-container-low px-4 py-3 font-sans text-sm text-on-surface outline-none transition-colors focus:border-terracotta focus:ring-1 focus:ring-terracotta/40 ${
          error ? 'border-error' : 'border-parchment-border'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
})
