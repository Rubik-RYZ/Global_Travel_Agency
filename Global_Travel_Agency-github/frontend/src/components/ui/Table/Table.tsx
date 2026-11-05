import type { ReactNode } from 'react'

export interface Columna<T> {
  clave: string
  encabezado: string
  render?: (fila: T) => ReactNode
}

interface TableProps<T> {
  columnas: Columna<T>[]
  datos: T[]
  vacio?: string
}

export function Table<T>({ columnas, datos, vacio = 'Sin registros.' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-parchment-border">
      <table className="w-full border-collapse text-left font-sans text-sm">
        <thead className="bg-surface-container-high">
          <tr>
            {columnas.map((c) => (
              <th
                key={c.clave}
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-8 text-center text-stamp-sepia">
                {vacio}
              </td>
            </tr>
          ) : (
            datos.map((fila, i) => (
              <tr key={i} className="border-t border-parchment-border hover:bg-surface-container-low">
                {columnas.map((c) => (
                  <td key={c.clave} className="px-4 py-3 text-on-surface">
                    {c.render
                      ? c.render(fila)
                      : String((fila as Record<string, unknown>)[c.clave] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}