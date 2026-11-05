/** Catálogos compartidos (espejo de las constantes del backend). */

export interface OpcionCatalogo {
  valor: string
  texto: string
}

// --- Tipos de documento de identidad ---
export const DOCUMENTOS: OpcionCatalogo[] = [
  { valor: 'CI', texto: 'Cédula de identidad' },
  { valor: 'PASAPORTE', texto: 'Pasaporte' },
  { valor: 'OTRO', texto: 'Otro' },
]

export function textoDocumento(valor: string | null | undefined): string {
  if (!valor) return '—'
  return DOCUMENTOS.find((d) => d.valor === valor)?.texto ?? valor
}

// --- Monedas ---
export const MONEDAS: OpcionCatalogo[] = [
  { valor: 'USD', texto: 'Dólar estadounidense · USD' },
  { valor: 'BOB', texto: 'Boliviano · BOB' },
  { valor: 'EUR', texto: 'Euro · EUR' },
]

export const SIMBOLO_MONEDA: Record<string, string> = {
  USD: '$',
  BOB: 'Bs',
  EUR: '€',
}

// --- Intereses / etiquetas (mismos que `INTERESES_SUGERIDOS`) ---
export const INTERESES: OpcionCatalogo[] = [
  { valor: 'playa', texto: 'Playa' },
  { valor: 'cultural', texto: 'Cultural' },
  { valor: 'aventura', texto: 'Aventura' },
  { valor: 'gastronomia', texto: 'Gastronomía' },
  { valor: 'naturaleza', texto: 'Naturaleza' },
  { valor: 'compras', texto: 'Compras' },
  { valor: 'romantico', texto: 'Romántico' },
  { valor: 'familiar', texto: 'Familiar' },
  { valor: 'historico', texto: 'Histórico' },
  { valor: 'nocturno', texto: 'Vida nocturna' },
]

export function textoInteres(valor: string): string {
  return INTERESES.find((i) => i.valor === valor)?.texto ?? valor
}
