import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { DocumentoTipo, Pasajero } from '@/types/reserva.types'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoFlechaDerecha,
  IconoPersona,
} from '@/components/ui/Iconos'
import { useReservaStore } from '@/store/reservaStore'
import { mensajeDeError } from '@/utils/validators'

export function ReservaPasajerosView() {
  const navigate = useNavigate()

  const paqueteId = useReservaStore((s) => s.paqueteId)
  const salidaId = useReservaStore((s) => s.salidaId)
  const numPersonas = useReservaStore((s) => s.numPersonas)
  const setReservaConfirmada = useReservaStore((s) => s.setReservaConfirmada)

  const [pasajeros, setPasajeros] = useState<Pasajero[]>(() =>
    Array.from({ length: numPersonas }, () => ({
      nombres: '',
      apellidos: '',
      documento_tipo: 'CI' as DocumentoTipo,
      documento_numero: '',
      fecha_nacimiento: '',
    }))
  )

  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paqueteId || !salidaId) {
      navigate('/viajes')
    }
  }, [paqueteId, salidaId, navigate])

  const actualizarPasajero = (index: number, campo: keyof Pasajero, valor: string) => {
    setPasajeros((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [campo]: valor }
      return copy
    })
  }

  const enviarReserva = async (e: FormEvent) => {
    e.preventDefault()
    if (!salidaId) return

    for (let i = 0; i < pasajeros.length; i++) {
      if (!pasajeros[i].nombres.trim() || !pasajeros[i].apellidos.trim()) {
        setError(`Por favor completa los nombres y apellidos del Pasajero ${i + 1}.`)
        return
      }
    }

    setOcupado(true)
    setError(null)
    try {
      const payload = {
        salida_id: salidaId,
        num_personas: numPersonas,
        canal: 'web' as const,
        pasajeros: pasajeros.map((p) => ({
          nombres: p.nombres.trim(),
          apellidos: p.apellidos.trim(),
          documento_tipo: p.documento_tipo || undefined,
          documento_numero: p.documento_numero?.trim() || undefined,
          fecha_nacimiento: p.fecha_nacimiento || undefined,
        })),
      }

      const res = await reservasApi.crearReserva(payload)
      setReservaConfirmada(res)
      navigate('/reservar/confirmacion')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf5eb] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Pasos */}
        <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-wider font-semibold">
          <Link to={`/reservar/${paqueteId}`} className="text-[#231a13]/60 hover:text-[#792609]">
            1. Salida y Plazas
          </Link>
          <span className="text-[#231a13]/30">→</span>
          <span className="text-[#792609] border-b-2 border-[#792609] pb-1">2. Datos de Viajeros</span>
          <span className="text-[#231a13]/30">→</span>
          <span className="text-[#231a13]/50">3. Confirmación</span>
        </div>

        <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-[#231a13]/10 pb-6">
            <h1 className="font-serif text-3xl font-bold text-[#231a13]">
              Registro de Pasajeros
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Ingresa los datos para la emisión del boleto de viaje y el manifiesto oficial de expedición ({numPersonas} pasajero/s).
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={enviarReserva} className="mt-8 space-y-8">
            {pasajeros.map((p, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb]/30 p-5 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-[#231a13]/10 pb-3">
                  <IconoPersona className="h-4 w-4 text-[#792609]" />
                  <h3 className="font-serif font-bold text-base text-[#231a13]">
                    Pasajero {idx + 1} {idx === 0 ? '(Titular de la reserva)' : ''}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80">Nombres *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Valeria Sofía"
                      value={p.nombres}
                      onChange={(e) => actualizarPasajero(idx, 'nombres', e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80">Apellidos *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mendoza Morales"
                      value={p.apellidos}
                      onChange={(e) => actualizarPasajero(idx, 'apellidos', e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80">Tipo Documento</label>
                    <select
                      value={p.documento_tipo || 'CI'}
                      onChange={(e) => actualizarPasajero(idx, 'documento_tipo', e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white p-2 text-sm"
                    >
                      <option value="CI">Cédula de Identidad</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="OTRO">Otro documento</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80">Número de Documento</label>
                    <input
                      type="text"
                      placeholder="Ej. 6849201"
                      value={p.documento_numero || ''}
                      onChange={(e) => actualizarPasajero(idx, 'documento_numero', e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={p.fecha_nacimiento || ''}
                      onChange={(e) => actualizarPasajero(idx, 'fecha_nacimiento', e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-[#231a13]/10 pt-6">
              <Button
                type="button"
                variante="ghost"
                onClick={() => navigate(`/reservar/${paqueteId}`)}
                disabled={ocupado}
              >
                ← Cambiar Plazas
              </Button>

              <Button
                type="submit"
                disabled={ocupado}
                className="flex items-center gap-2 rounded-full bg-[#792609] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#983d1f]"
              >
                <span>{ocupado ? 'Confirmando Reserva...' : 'Confirmar y Finalizar Reserva'}</span>
                <IconoFlechaDerecha className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

