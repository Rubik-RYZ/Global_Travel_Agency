import { useEffect, useState } from 'react'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'

let cache: DestinoResumen[] | null = null
let enVuelo: Promise<DestinoResumen[]> | null = null

function cargar(): Promise<DestinoResumen[]> {
  if (cache) return Promise.resolve(cache)
  if (!enVuelo) {
    enVuelo = catalogoApi
      .listarDestinos({})
      .then((data) => {
        cache = data.results
        return cache
      })
      .catch(() => [] as DestinoResumen[])
  }
  return enVuelo
}

export function useCuadernoDestinos(): DestinoResumen[] {
  const [destinos, setDestinos] = useState<DestinoResumen[]>(cache ?? [])

  useEffect(() => {
    let vivo = true
    cargar().then((d) => {
      if (vivo) setDestinos(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  return destinos
}

export const ORDEN_REGIONES = [
  'america_del_sur',
  'europa',
  'asia',
  'africa',
  'america_del_norte',
  'oceania',
] as const

export interface GrupoRegion {
  clave: string
  nombre: string
  rutas: number
  muestra: string
}

export function agruparRegiones(destinos: DestinoResumen[]): GrupoRegion[] {
  const mapa = new Map<string, DestinoResumen[]>()
  for (const d of destinos) {
    if (!d.region) continue
    const lista = mapa.get(d.region) ?? []
    lista.push(d)
    mapa.set(d.region, lista)
  }
  const orden = (clave: string) => {
    const i = ORDEN_REGIONES.indexOf(clave as (typeof ORDEN_REGIONES)[number])
    return i === -1 ? 99 : i
  }
  return [...mapa.entries()]
    .sort((a, b) => orden(a[0]) - orden(b[0]))
    .map(([clave, lista]) => ({
      clave,
      nombre: lista[0].region_display ?? clave,
      rutas: lista.length,
      muestra: lista
        .slice(0, 3)
        .map((d) => d.nombre)
        .join(' · '),
    }))
}

export const CARACTERES = [
  { clave: 'arqueologico', nombre: 'Arqueología y templos' },
  { clave: 'cultural', nombre: 'Cultural y patrimonial' },
  { clave: 'naturaleza', nombre: 'Naturaleza y paisaje' },
  { clave: 'aventura', nombre: 'Aventura y trekking' },
  { clave: 'gastronomico', nombre: 'Gastronomía y enoturismo' },
  { clave: 'descanso', nombre: 'Villas y retiros' },
] as const
