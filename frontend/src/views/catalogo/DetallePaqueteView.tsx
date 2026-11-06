import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { catalogoApi } from '@/api/catalogo'
import type { Paquete, PaqueteSalida } from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoEdificio,
  IconoFlechaDerecha,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { useReservaStore } from '@/store/reservaStore'
import { mensajeDeError } from '@/utils/validators'

export function DetallePaqueteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [paquete, setPaquete] = useState<Paquete | null>(null)
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])
  const [salidaSeleccionada, setSalidaSeleccionada] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setPaqueteStore = useReservaStore((s) => s.setPaquete)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [pData, sData] = await Promise.all([
          catalogoApi.obtenerPaquete(Number(id)),
          catalogoApi.listarSalidas({ paquete_id: Number(id), solo_con_cupo: true }),
        ])
        setPaquete(pData)
        setSalidas(sData.results || [])
        if (sData.results && sData.results.length > 0) {
          setSalidaSeleccionada(sData.results[0].id)
        }
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  const iniciarReserva = () => {
    if (!paquete || !salidaSeleccionada) return
    setPaqueteStore(paquete.id, salidaSeleccionada)
    navigate(`/reservar/${paquete.id}`)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-serif text-lg text-[#231a13]/60">
        Preparando cuaderno de viaje...
      </div>
    )
  }

  if (error || !paquete) {
    return (
      <div className="mx-auto max-w-3xl py-16 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#792609]">No pudimos cargar la expedición</h2>
        <p className="mt-2 text-sm text-[#231a13]/70">{error || 'El paquete solicitado no existe.'}</p>
        <Link
          to="/viajes"
          className="mt-6 inline-block rounded-full bg-[#792609] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#983d1f]"
        >
          Volver al catálogo de viajes
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf5eb] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Enlace de regreso */}
        <div>
          <Link
            to="/viajes"
            className="text-xs uppercase tracking-wider font-semibold text-[#792609] hover:underline"
          >
            ← Volver a todas las expediciones
          </Link>
        </div>

        {/* Cabecera del Paquete */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#792609]">
              <IconoUbicacion className="h-4 w-4" />
              <span>{paquete.destino_nombre || 'Destino Exclusivo'}</span>
              <span>•</span>
              <span>{paquete.duracion_dias} DÍAS / {paquete.duracion_dias - 1} NOCHES</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#231a13]">
              {paquete.nombre}
            </h1>

            <p className="text-base text-[#231a13]/80 leading-relaxed font-sans">
              {paquete.descripcion}
            </p>

            {paquete.hotel_nombre && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#231a13]/10 bg-white p-4 shadow-sm">
                <IconoEdificio className="h-5 w-5 text-[#792609]" />
                <div>
                  <div className="text-xs uppercase text-[#231a13]/50">Alojamiento reservado</div>
                  <div className="font-serif font-bold text-[#231a13]">
                    {paquete.hotel_nombre}
                    {paquete.hotel_estrellas && (
                      <span className="ml-2 text-xs text-amber-600">
                        {'★'.repeat(paquete.hotel_estrellas)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta Lateral de Salidas y Reserva */}
          <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 shadow-sm space-y-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#231a13]/60">Tarifa por persona</div>
              <div className="font-serif text-3xl font-bold text-[#792609]">
                {paquete.moneda} {Number(paquete.precio_base).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#231a13]/50">Incluye hospedaje y salidas grupales</div>
            </div>

            <div className="border-t border-[#231a13]/10 pt-4">
              <label className="text-xs font-semibold uppercase text-[#231a13]/80 block mb-2">
                Selecciona Fecha de Salida ({salidas.length} disponibles)
              </label>

              {salidas.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  No hay salidas con cupos disponibles por el momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {salidas.map((s) => {
                    const sel = salidaSeleccionada === s.id
                    const f = new Date(s.fecha_salida + 'T00:00:00').toLocaleDateString('es-BO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSalidaSeleccionada(s.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition-all ${
                          sel
                            ? 'border-[#792609] bg-[#792609]/5 ring-1 ring-[#792609]'
                            : 'border-[#231a13]/10 hover:border-[#231a13]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#231a13] capitalize">{f}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {s.cupos_disponibles} cupos
                          </span>
                        </div>
                        {s.vuelo_ida_detalle && (
                          <div className="mt-1 text-[11px] text-[#231a13]/60">
                            Vuelo ida: {s.vuelo_ida_detalle.numero_vuelo} ({s.vuelo_ida_detalle.origen_codigo} → {s.vuelo_ida_detalle.destino_codigo})
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Button
              onClick={iniciarReserva}
              disabled={salidas.length === 0 || !salidaSeleccionada}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#792609] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#983d1f] disabled:opacity-50"
            >
              <span>Reservar Mi Viaje</span>
              <IconoFlechaDerecha className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
