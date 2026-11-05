import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Reserva } from '@/types/reserva.types'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoPersona,
  IconoPortapapeles,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function DetalleViajeView() {
  const { id } = useParams<{ id: string }>()
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)

  const cargar = async () => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const data = await reservasApi.obtenerReserva(Number(id))
      setReserva(data)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [id])

  const cancelar = async () => {
    if (!reserva) return
    if (!confirm(`¿Confirmas la cancelación de la reserva ${reserva.codigo}? Tus cupos serán liberados al inventario.`)) return

    setCancelando(true)
    try {
      const actualizada = await reservasApi.cancelarReserva(reserva.id)
      setReserva(actualizada)
      setAviso('La reserva ha sido cancelada y los cupos reintegrados.')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCancelando(false)
    }
  }

  if (cargando) {
    return (
      <div className="py-16 text-center font-serif text-base text-[#231a13]/50">
        Cargando expediente de viaje...
      </div>
    )
  }

  if (error || !reserva) {
    return (
      <div className="py-16 text-center">
        <h2 className="font-serif text-xl font-bold text-[#792609]">No se pudo cargar la reserva</h2>
        <p className="mt-2 text-xs text-[#231a13]/70">{error || 'Reserva no encontrada.'}</p>
        <Link to="/mi-cuenta/viajes" className="mt-4 inline-block text-xs font-semibold text-[#792609] hover:underline">
          ← Volver a Mis Viajes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="border-b border-[#231a13]/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/mi-cuenta/viajes" className="text-xs uppercase font-semibold text-[#792609] hover:underline block mb-2">
            ← Volver al padrón de mis viajes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-[#231a13]">{reserva.codigo}</h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                reserva.estado === 'confirmada'
                  ? 'bg-emerald-100 text-emerald-800'
                  : reserva.estado === 'pendiente'
                  ? 'bg-amber-100 text-amber-800'
                  : reserva.estado === 'pagada'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {reserva.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/mi-cuenta/viajes/${reserva.id}/itinerario`}
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoPortapapeles className="h-4 w-4" />
            <span>Itinerario de Viaje</span>
          </Link>

          {reserva.estado !== 'cancelada' && (
            <Button
              variante="ghost"
              onClick={cancelar}
              disabled={cancelando}
              className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              {cancelando ? 'Cancelando...' : 'Cancelar Reserva'}
            </Button>
          )}
        </div>
      </div>

      {aviso && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          {aviso}
        </div>
      )}

      {/* Resumen de Expedición */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-[#231a13]/10 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-[#231a13]/50">Titular de la Reserva</div>
          <div className="mt-1 font-serif text-lg font-bold text-[#231a13]">{reserva.cliente_nombre}</div>
          <div className="text-xs text-[#231a13]/60">Doc: {reserva.cliente_documento || 'No registrado'}</div>
        </div>

        <div className="rounded-xl border border-[#231a13]/10 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-[#231a13]/50">Plazas y Canal</div>
          <div className="mt-1 font-serif text-lg font-bold text-[#231a13]">{reserva.num_personas} Viajero(s)</div>
          <div className="text-xs text-[#231a13]/60 capitalize">Canal: {reserva.canal}</div>
        </div>

        <div className="rounded-xl border border-[#231a13]/10 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-[#231a13]/50">Liquidación Total</div>
          <div className="mt-1 font-serif text-xl font-bold text-[#792609]">
            {reserva.moneda} {Number(reserva.total).toFixed(2)}
          </div>
          <div className="text-xs text-[#231a13]/60">
            {reserva.estado === 'pendiente' ? 'Liquidación pendiente de pago' : 'Importe liquidado'}
          </div>
        </div>
      </div>

      {/* Lista de Pasajeros */}
      <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-[#231a13] mb-4">
          Manifiesto de Pasajeros ({reserva.pasajeros?.length || 0})
        </h2>

        <div className="divide-y divide-[#231a13]/10">
          {reserva.pasajeros?.map((p, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <IconoPersona className="h-4 w-4 text-[#792609]" />
                <div>
                  <span className="font-bold text-[#231a13]">
                    {p.nombres} {p.apellidos}
                  </span>
                  <span className="ml-2 text-xs text-[#231a13]/50">
                    {idx === 0 ? '(Principal)' : ''}
                  </span>
                </div>
              </div>
              <div className="text-xs text-[#231a13]/70">
                {p.documento_tipo}: {p.documento_numero || 'Sin doc'}
                {p.fecha_nacimiento && ` • Nac: ${p.fecha_nacimiento}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

