/** Tipos genéricos de la API (paginación DRF). */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
