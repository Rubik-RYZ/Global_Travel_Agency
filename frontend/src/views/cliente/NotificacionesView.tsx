import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Notificacion } from '@/types/reserva.types'
import {
  IconoFlechaDerecha,
  IconoSobre,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function NotificacionesView() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await reservasApi.listarNotificaciones()
        setNotificaciones(res.results || [])
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
        <h1 className="font-serif text-3xl font-bold text-[#231a13]">Centro de Notificaciones</h1>
        <p className="mt-1 text-sm text-[#231a13]/70">
          Avisos transaccionales y confirmaciones de correo enviados a su cuenta.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="py-12 text-center text-sm text-[#231a13]/50 font-serif">
          Consultando notificaciones...
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#231a13]/20 bg-[#faf5eb]/50 p-12 text-center">
          <IconoSobre className="mx-auto h-8 w-8 text-[#792609]/60" />
          <h3 className="mt-3 font-serif text-lg font-bold text-[#231a13]">
            No tienes avisos pendientes
          </h3>
          <p className="mt-1 text-xs text-[#231a13]/60 max-w-sm mx-auto">
            Aquí aparecerán las confirmaciones de sus reservas e itinerarios despachados por correo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n) => {
            const fecha = new Date(n.creado_en).toLocaleString('es-BO', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })

            const titulo =
              n.tipo === 'confirmacion_reserva'
                ? 'Confirmación de Reserva Emitida'
                : n.tipo === 'itinerario'
                ? 'Itinerario de Viaje Disponible'
                : 'Comprobante Oficial'

            return (
              <div
                key={n.id}
                className="flex items-center justify-between rounded-xl border border-[#231a13]/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#792609]/10 text-[#792609]">
                    <IconoSobre className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#231a13]">{titulo}</div>
                    <div className="text-xs text-[#231a13]/60">
                      Reserva: {n.reserva_codigo || 'Expedición'} • {fecha}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      n.estado === 'enviada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {n.estado.toUpperCase()}
                  </span>

                  {n.reserva && (
                    <Link
                      to={`/mi-cuenta/viajes/${n.reserva}/itinerario`}
                      className="rounded p-1 text-[#231a13]/60 hover:text-[#792609]"
                      title="Ver viaje"
                    >
                      <IconoFlechaDerecha className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

