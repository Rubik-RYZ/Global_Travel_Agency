/** Utilidades de formato: monedas BOB/USD/EUR, fechas y duración de vuelo. */

const formatoMoneda: Record<string, Intl.NumberFormat> = {
  BOB: new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
}

export function formatearMoneda(monto: number | string, moneda = 'USD'): string {
  const valor = typeof monto === 'string' ? Number(monto) : monto
  const fmt = formatoMoneda[moneda] ?? formatoMoneda.USD
  return fmt.format(Number.isFinite(valor) ? valor : 0)
}

export function formatearFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatearFechaHora(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Duración legible entre dos fechas ISO (ej. "9 h 45 min"). */
export function formatearDuracion(salida: string, llegada: string): string {
  const ms = new Date(llegada).getTime() - new Date(salida).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalMin = Math.round(ms / 60000)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  return minutos ? `${horas} h ${minutos} min` : `${horas} h`
}
