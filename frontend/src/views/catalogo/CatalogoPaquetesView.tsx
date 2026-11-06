import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'
import type { Paquete } from '@/types/catalogo.types'
import {
  IconoEdificio,
  IconoFlechaDerecha,
  IconoLupa,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function CatalogoPaquetesView() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroDestino, setFiltroDestino] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resPaq, resDest] = await Promise.all([
        catalogoApi.listarPaquetes({
          destino_id: filtroDestino ? Number(filtroDestino) : undefined,
          solo_activos: true,
          q: busqueda || undefined,
        }),
        catalogoApi.listarDestinos(),
      ])
      setPaquetes(resPaq.results || [])
      setDestinos(resDest.results || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroDestino, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  return (
    <div className="min-h-screen bg-[#faf5eb] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Cabecera Editorial Terranova */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#792609]">
            Expediciones y Travesías Diseñadas
          </div>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#231a13]">
            Catálogo de Paquetes Turísticos
          </h1>
          <p className="mt-4 text-base text-[#231a13]/70 font-sans leading-relaxed">
            Cada viaje es una narración viva: rutas preparadas con hoteles de encanto patrimonial,
            asientos aéreos reservados y salidas grupales con cupos exclusivos.
          </p>
        </div>

        {/* Barra de Filtros */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-[#231a13]/10 bg-white p-4 shadow-sm">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Buscar por experiencia, enclave o palabra clave (ej. inca, salar, safari)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-[#231a13]/20 bg-[#faf5eb]/50 pl-10 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#792609]/20"
            />
            <IconoLupa className="absolute left-3.5 top-3.5 h-4 w-4 text-[#231a13]/40" />
          </div>

          <div>
            <select
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full rounded-xl border border-[#231a13]/20 bg-[#faf5eb]/50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#792609]/20"
            >
              <option value="">Todos los destinos</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.pais})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Listado de Paquetes */}
        <div className="mt-10">
          {cargando ? (
            <div className="py-20 text-center text-[#231a13]/50 font-serif">
              Cargando catálogo de expediciones...
            </div>
          ) : paquetes.length === 0 ? (
            <div className="py-20 text-center text-[#231a13]/50">
              No se encontraron paquetes disponibles con esos filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {paquetes.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#231a13]/10 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <div>
                    {/* Imagen de destino si existe */}
                    {p.destino_imagen_principal ? (
                      <div className="h-48 w-full overflow-hidden bg-[#231a13]/5">
                        <img
                          src={p.destino_imagen_principal}
                          alt={p.nombre}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-[#792609]/10 text-[#792609]">
                        <IconoUbicacion className="h-8 w-8" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#792609]">
                        <span>{p.destino_nombre}</span>
                        <span>{p.duracion_dias} DÍAS</span>
                      </div>

                      <h2 className="mt-2 font-serif text-xl font-bold text-[#231a13] line-clamp-1">
                        {p.nombre}
                      </h2>

                      {p.hotel_nombre && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#231a13]/60">
                          <IconoEdificio className="h-3.5 w-3.5 text-[#231a13]/40" />
                          <span>Hospedaje: {p.hotel_nombre}</span>
                          {p.hotel_estrellas && (
                            <span className="text-amber-600">
                              {'★'.repeat(p.hotel_estrellas)}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-3 text-xs text-[#231a13]/70 line-clamp-3 leading-relaxed">
                        {p.descripcion || 'Una travesía inolvidable con guías especializados y logística integral.'}
                      </p>

                      {p.etiquetas && p.etiquetas.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1">
                          {p.etiquetas.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-[#faf5eb] px-2.5 py-0.5 text-[10px] uppercase font-medium text-[#231a13]/70 border border-[#231a13]/10"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#231a13]/10 bg-[#faf5eb]/50 p-6 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#231a13]/60">
                        Desde por persona
                      </div>
                      <div className="font-serif text-2xl font-bold text-[#792609]">
                        {p.moneda} {Number(p.precio_base).toFixed(0)}
                      </div>
                    </div>

                    <Link
                      to={`/viajes/${p.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#792609] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#983d1f]"
                    >
                      <span>Ver Salidas</span>
                      <IconoFlechaDerecha className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

