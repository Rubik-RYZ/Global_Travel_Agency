import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Reserva } from '@/types/reserva.types'
import {
  IconoFlechaDerecha,
  IconoPortapapeles,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function MisViajesView() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await reservasApi.listarReservas()
        setReservas(res.results || [])
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="space-y-6">
      <header className="border-b border-[#231a13]/10 pb-4">
        <h1 className="font-serif text-3xl font-bold text-[#231a13]">Mis Viajes y Expediciones</h1>
        <p className="mt-1 text-sm text-[#231a13]/70">
          Bitácora de travesías reservadas, estados de confirmación e itinerarios activos.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="py-12 text-center text-sm text-[#231a13]/50 font-serif">
          Consultando sus expediciones...
        </div>
      ) : reservas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#231a13]/20 bg-[#faf5eb]/50 p-12 text-center">
          <IconoUbicacion className="mx-auto h-8 w-8 text-[#792609]/60" />
          <h3 className="mt-3 font-serif text-lg font-bold text-[#231a13]">
            Aún no tienes viajes reservados
          </h3>
          <p className="mt-1 text-xs text-[#231a13]/60 max-w-sm mx-auto">
            Explora nuestro catálogo de autor y asegura tus plazas para la próxima expedición.
          </p>
          <Link
            to="/viajes"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#792609] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#983d1f]"
          >
            <span>Explorar Paquetes</span>
            <IconoFlechaDerecha className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((r) => {
            const fechaSalida = r.fecha_salida
              ? new Date(r.fecha_salida + 'T00:00:00').toLocaleDateString('es-BO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Fecha por confirmar'

            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-2xl border border-[#231a13]/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#792609] bg-[#792609]/5 px-2 py-0.5 rounded">
                        {r.codigo}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.estado === 'confirmada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.estado === 'pendiente'
                            ? 'bg-amber-100 text-amber-800'
                            : r.estado === 'pagada'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.estado.toUpperCase()}
                      </span>
                    </div>

                    <h2 className="mt-2 font-serif text-xl font-bold text-[#231a13]">
                      {r.paquete_nombre || 'Expedición Illimani'}
                    </h2>

                    <div className="mt-1 flex items-center gap-4 text-xs text-[#231a13]/70">
                      <span>Destino: {r.destino_nombre}</span>
                      <span>•</span>
                      <span>Partida: {fechaSalida}</span>
                      <span>•</span>
                      <span>{r.num_personas} Pasajero(s)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 border-t sm:border-t-0 border-[#231a13]/10 pt-3 sm:pt-0">
                    <div className="font-serif text-2xl font-bold text-[#792609]">
                      {r.moneda} {Number(r.total).toFixed(2)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/mi-cuenta/viajes/${r.id}/itinerario`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#792609] px-4 py-1.5 text-xs font-semibold text-[#792609] hover:bg-[#792609]/5"
                      >
                        <IconoPortapapeles className="h-3.5 w-3.5" />
                        <span>Itinerario</span>
                      </Link>

                      <Link
                        to={`/mi-cuenta/viajes/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#792609] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#983d1f]"
                      >
                        <span>Detalles</span>
                        <IconoFlechaDerecha className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

