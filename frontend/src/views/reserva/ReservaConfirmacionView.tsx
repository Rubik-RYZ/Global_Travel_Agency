import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { descargarBlob, pagosApi } from '@/api/pagos'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoDescarga,
  IconoFlechaDerecha,
  IconoPortapapeles,
  IconoSello,
} from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal/Modal'
import { useAuthStore } from '@/store/authStore'
import { useReservaStore } from '@/store/reservaStore'
import type { MetodoCliente } from '@/types/pago.types'
import { mensajeDeError } from '@/utils/validators'

export function ReservaConfirmacionView() {
  const navigate = useNavigate()
  const reserva = useReservaStore((s) => s.reservaConfirmada)
  const setReservaConfirmada = useReservaStore((s) => s.setReservaConfirmada)
  const usuario = useAuthStore((s) => s.usuario)

  const [metodo, setMetodo] = useState<MetodoCliente>('tarjeta')
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const [alerta, setAlerta] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  useEffect(() => {
    if (!reserva) {
      navigate('/viajes')
    }
  }, [reserva, navigate])

  if (!reserva) return null

  const pagada = reserva.estado === 'pagada'

  const pagar = async () => {
    setPagando(true)
    setErrorPago(null)
    try {
      const res = await pagosApi.pagarCliente({ reserva_id: reserva.id, metodo })
      setReservaConfirmada(res.reserva)
      setAlerta(true)
    } catch (err) {
      setErrorPago(mensajeDeError(err))
    } finally {
      setPagando(false)
    }
  }

  const descargarBoleta = async () => {
    setDescargando(true)
    setErrorDescarga(null)
    try {
      const blob = await pagosApi.descargarBoleta(reserva.id)
      descargarBlob(blob, `boleta-${reserva.codigo}.pdf`)
      setAlerta(false)
    } catch (err) {
      setErrorDescarga(mensajeDeError(err))
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf5eb] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-[#231a13]/10 bg-white p-8 sm:p-12 text-center shadow-lg">
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

          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#792609] bg-[#faf5eb]/70 p-6">
            <div className="text-xs uppercase font-semibold text-[#231a13]/60">Código Oficial de Reserva</div>
            <div className="mt-1 font-mono text-3xl sm:text-4xl font-bold tracking-wider text-[#792609]">
              {reserva.codigo}
            </div>
            <div
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                pagada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pagada ? 'Pagada — boleta disponible' : 'Estado: Pendiente de pago'}
            </div>
          </div>

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

          {usuario && !pagada && (
            <div className="mt-8 rounded-2xl border border-[#231a13]/10 bg-[#faf5eb]/50 p-6 text-left space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#231a13]">Pago en línea</h2>
              <p className="text-xs text-[#231a13]/60">
                Elige cómo deseas pagar tu reserva. La confirmación es inmediata y podrás descargar tu boleta.
              </p>

              <div className="flex gap-2">
                {(['tarjeta', 'qr'] as MetodoCliente[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodo(m)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase ${
                      metodo === m
                        ? 'bg-[#792609] text-white'
                        : 'border border-[#231a13]/20 text-[#231a13]'
                    }`}
                  >
                    {m === 'tarjeta' ? 'Tarjeta' : 'QR'}
                  </button>
                ))}
              </div>

              {errorPago && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorPago}
                </div>
              )}

              <Button
                onClick={pagar}
                disabled={pagando}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#792609] py-3 text-sm font-semibold text-white hover:bg-[#983d1f] disabled:opacity-50"
              >
                <span>{pagando ? 'Procesando pago...' : 'Pagar y emitir boleto'}</span>
                <IconoDescarga className="h-4 w-4" />
              </Button>
            </div>
          )}

          {pagada && (
            <div className="mt-8">
              <Button
                onClick={descargarBoleta}
                disabled={descargando}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#792609] py-3 text-sm font-semibold text-white hover:bg-[#983d1f] disabled:opacity-50"
              >
                <IconoDescarga className="h-4 w-4" />
                <span>{descargando ? 'Generando PDF...' : 'Descargar boleto'}</span>
              </Button>
              {errorDescarga && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorDescarga}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`/mi-cuenta/viajes/${reserva.id}/itinerario`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#231a13]/20 bg-white px-6 py-3 text-sm font-semibold text-[#231a13] hover:bg-[#faf5eb]"
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

      <Modal abierto={alerta} onCerrar={() => setAlerta(false)} titulo="Pago confirmado" ancho="sm">
        <div className="space-y-5">
          <p className="text-sm text-[#231a13]/80">
            Tu pago fue aprobado. ¿Desea descargar el boleto de viaje?
          </p>

          {errorDescarga && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorDescarga}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variante="ghost" onClick={() => setAlerta(false)} disabled={descargando}>
              Ahora no
            </Button>
            <Button
              onClick={descargarBoleta}
              disabled={descargando}
              className="flex items-center gap-2 bg-[#792609] text-white hover:bg-[#983d1f]"
            >
              <IconoDescarga className="h-4 w-4" />
              <span>{descargando ? 'Generando PDF...' : 'Descargar boleto'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
