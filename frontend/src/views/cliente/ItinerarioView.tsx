import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Itinerario } from '@/types/reserva.types'
import { IconoPortapapeles } from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function ItinerarioView() {
  const { id } = useParams<{ id: string }>()
  const [itinerario, setItinerario] = useState<Itinerario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await reservasApi.obtenerItinerarioPorReserva(Number(id))
        setItinerario(res)
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  if (cargando) {
    return (
      <div className="py-20 text-center font-serif text-[#231a13]/50">
        Preparando cuaderno de ruta e itinerario oficial...
      </div>
    )
  }

  if (error || !itinerario) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-serif text-xl font-bold text-[#792609]">No pudimos cargar el itinerario</h2>
        <p className="mt-2 text-xs text-[#231a13]/70">{error || 'Itinerario aún no disponible.'}</p>
        <Link to="/mi-cuenta/viajes" className="mt-4 inline-block text-xs font-semibold text-[#792609] hover:underline">
          ← Volver a Mis Viajes
        </Link>
      </div>
    )
  }

  // Agrupar actividades por día
  const itemsPorDia = (itinerario.items || []).reduce<Record<number, typeof itinerario.items>>((acc, it) => {
    if (!acc[it.dia]) acc[it.dia] = []
    acc[it.dia].push(it)
    return acc
  }, {})

  const diasOrdenados = Object.keys(itemsPorDia)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="border-b border-[#231a13]/10 pb-6 flex items-center justify-between">
        <div>
          <Link to={`/mi-cuenta/viajes/${id}`} className="text-xs uppercase font-semibold text-[#792609] hover:underline block mb-2">
            ← Volver al expediente de la reserva
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
            <IconoPortapapeles className="h-4 w-4" />
            <span>Itinerario de Expedición</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#231a13]">
            Diario de Viaje · Reserva {itinerario.reserva_codigo || `#${itinerario.reserva}`}
          </h1>
          <p className="mt-1 text-xs text-[#231a13]/60">
            Composición: {itinerario.generado_por === 'sistema' ? 'Generado automáticamente por el sistema' : 'Personalizado por su agente de viajes'}
          </p>
        </div>
      </div>

      {diasOrdenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#231a13]/20 bg-white p-12 text-center text-sm text-[#231a13]/50">
          No hay actividades programadas en este itinerario todavía.
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#792609]/20">
          {diasOrdenados.map((diaNum) => (
            <div key={diaNum} className="relative pl-10 space-y-4">
              {/* Marcador del día */}
              <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#792609] font-serif font-bold text-xs text-white shadow-sm ring-4 ring-[#faf5eb]">
                {diaNum}
              </div>

              <div>
                <h2 className="font-serif text-xl font-bold text-[#231a13]">
                  Día {diaNum} de Expedición
                </h2>
              </div>

              {/* Lista de actividades del día */}
              <div className="space-y-3">
                {itemsPorDia[diaNum].map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="rounded-2xl border border-[#231a13]/10 bg-white p-5 shadow-sm space-y-2 transition-all hover:shadow"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-[#792609]">
                        {it.titulo}
                      </h3>
                      {it.hora && (
                        <span className="font-mono text-xs font-semibold text-[#231a13]/60 bg-[#faf5eb] px-2.5 py-0.5 rounded-full border border-[#231a13]/10">
                          {it.hora.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    {it.descripcion && (
                      <p className="text-xs text-[#231a13]/70 font-sans leading-relaxed">
                        {it.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

