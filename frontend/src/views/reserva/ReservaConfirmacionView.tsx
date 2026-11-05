import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  IconoFlechaDerecha,
  IconoPortapapeles,
  IconoSello,
} from '@/components/ui/Iconos'
import { useReservaStore } from '@/store/reservaStore'

export function ReservaConfirmacionView() {
  const navigate = useNavigate()
  const reserva = useReservaStore((s) => s.reservaConfirmada)

  useEffect(() => {
    if (!reserva) {
      navigate('/viajes')
    }
  }, [reserva, navigate])

  if (!reserva) return null

  return (
    <div className="min-h-screen bg-[#faf5eb] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-[#231a13]/10 bg-white p-8 sm:p-12 text-center shadow-lg">
          {/* Sello de Confirmación */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#792609]/10 text-[#792609]">
            <IconoSello className="h-10 w-10" />
          </div>

          <div className="mt-6 text-xs uppercase tracking-widest font-bold text-[#792609]">
            Reserva Registrada Exitosamente
          </div>

          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#231a13]">
            ¡Expedición Asegurada!
          </h1>

          <p className="mt-3 text-sm text-[#231a13]/70 font-sans leading-relaxed">
            Hemos bloqueado sus plazas y emitido su expediente de viaje oficial.
            El itinerario detallado de la travesía ya ha sido generado por el sistema.
          </p>

          {/* Código de Reserva */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#792609] bg-[#faf5eb]/70 p-6">
            <div className="text-xs uppercase font-semibold text-[#231a13]/60">Código Oficial de Reserva</div>
            <div className="mt-1 font-mono text-3xl sm:text-4xl font-bold tracking-wider text-[#792609]">
              {reserva.codigo}
            </div>
            <div className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Estado: Pendiente de pago (Listo para confirmación final)
            </div>
          </div>

          {/* Resumen */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#231a13]/10 pt-6 text-left text-xs">
            <div>
              <span className="text-[#231a13]/50 block">Viajeros registrados:</span>
              <span className="font-semibold text-sm text-[#231a13]">{reserva.num_personas} persona(s)</span>
            </div>
            <div>
              <span className="text-[#231a13]/50 block">Importe total:</span>
              <span className="font-serif font-bold text-base text-[#792609]">
                {reserva.moneda} {Number(reserva.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`/mi-cuenta/viajes/${reserva.id}/itinerario`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#792609] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#983d1f]"
            >
              <IconoPortapapeles className="h-4 w-4" />
              <span>Ver Itinerario Completo</span>
            </Link>

            <Link
              to="/mi-cuenta/viajes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#231a13]/20 bg-white px-6 py-3 text-sm font-semibold text-[#231a13] hover:bg-[#faf5eb]"
            >
              <span>Ir a Mis Viajes</span>
              <IconoFlechaDerecha className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

