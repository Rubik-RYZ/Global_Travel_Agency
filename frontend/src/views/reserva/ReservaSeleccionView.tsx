import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { catalogoApi } from '@/api/catalogo'
import type { Paquete, PaqueteSalida } from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoFlechaDerecha,
  IconoPersona,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { useReservaStore } from '@/store/reservaStore'
import { mensajeDeError } from '@/utils/validators'

export function ReservaSeleccionView() {
  const { paqueteId } = useParams<{ paqueteId: string }>()
  const navigate = useNavigate()

  const storeSalidaId = useReservaStore((s) => s.salidaId)
  const setPaqueteStore = useReservaStore((s) => s.setPaquete)
  const setPersonasStore = useReservaStore((s) => s.setPersonas)

  const [paquete, setPaquete] = useState<Paquete | null>(null)
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])
  const [salidaId, setSalidaId] = useState<number | null>(storeSalidaId)
  const [numPersonas, setNumPersonas] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paqueteId) return
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [resP, resS] = await Promise.all([
          catalogoApi.obtenerPaquete(Number(paqueteId)),
          catalogoApi.listarSalidas({ paquete_id: Number(paqueteId), solo_con_cupo: true }),
        ])
        setPaquete(resP)
        setSalidas(resS.results || [])
        if (!salidaId && resS.results && resS.results.length > 0) {
          setSalidaId(resS.results[0].id)
        }
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [paqueteId])

  const salidaSeleccionada = salidas.find((s) => s.id === salidaId)
  const cuposMaximos = salidaSeleccionada ? salidaSeleccionada.cupos_disponibles : 1
  const precioUnitario = paquete ? Number(paquete.precio_base) : 0
  const totalEstimado = precioUnitario * numPersonas

  const avanzar = () => {
    if (!paquete || !salidaId) return
    setPaqueteStore(paquete.id, salidaId)
    setPersonasStore(numPersonas)
    navigate('/reservar/pasajeros')
  }

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-serif text-lg text-[#231a13]/60">
        Cargando opciones de viaje...
      </div>
    )
  }

  if (error || !paquete) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#792609]">No pudimos abrir el proceso de reserva</h2>
        <p className="mt-2 text-sm text-[#231a13]/70">{error || 'El paquete seleccionado no existe.'}</p>
        <Link
          to="/viajes"
          className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-[#792609] hover:underline"
        >
          Volver al catálogo de expediciones
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf5eb] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Pasos */}
        <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-wider font-semibold">
          <span className="text-[#792609] border-b-2 border-[#792609] pb-1">1. Salida y Plazas</span>
          <span className="text-[#231a13]/30">→</span>
          <span className="text-[#231a13]/50">2. Datos de Viajeros</span>
          <span className="text-[#231a13]/30">→</span>
          <span className="text-[#231a13]/50">3. Confirmación</span>
        </div>

        {/* Ficha Principal */}
        <div className="overflow-hidden rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-[#231a13]/10 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#792609]">
              <IconoUbicacion className="h-4 w-4" />
              <span>{paquete.destino_nombre}</span>
              <span>•</span>
              <span>{paquete.duracion_dias} Días</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#231a13]">
              Reserva de plazas: {paquete.nombre}
            </h1>
          </div>

          <div className="mt-8 space-y-6">
            {/* Selector de salida */}
            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80 block mb-2">
                Fecha de Partida Programada
              </label>
              {salidas.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Actualmente no existen salidas con cupos libres para este viaje.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {salidas.map((s) => {
                    const sel = salidaId === s.id
                    const f = new Date(s.fecha_salida + 'T00:00:00').toLocaleDateString('es-BO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSalidaId(s.id)
                          if (numPersonas > s.cupos_disponibles) {
                            setNumPersonas(s.cupos_disponibles)
                          }
                        }}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          sel
                            ? 'border-[#792609] bg-[#792609]/5 ring-2 ring-[#792609]'
                            : 'border-[#231a13]/10 hover:border-[#231a13]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#231a13] capitalize">{f}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {s.cupos_disponibles} cupos
                          </span>
                        </div>
                        {s.vuelo_ida_detalle && (
                          <div className="mt-1 text-xs text-[#231a13]/60">
                            Vuelo: {s.vuelo_ida_detalle.numero_vuelo} ({s.vuelo_ida_detalle.origen_codigo} → {s.vuelo_ida_detalle.destino_codigo})
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Número de viajeros */}
            {salidaSeleccionada && (
              <div className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb]/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-[#231a13]/80 block">
                      Número de Pasajeros
                    </label>
                    <p className="text-xs text-[#231a13]/60">
                      Disponibilidad inmediata: {cuposMaximos} plazas
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={numPersonas <= 1}
                      onClick={() => setNumPersonas((n) => Math.max(1, n - 1))}
                      className="h-10 w-10 rounded-full border border-[#231a13]/20 bg-white font-bold text-lg text-[#231a13] hover:bg-[#faf5eb] disabled:opacity-40"
                    >
                      -
                    </button>
                    <div className="flex items-center gap-1.5 px-3 font-serif text-2xl font-bold text-[#792609]">
                      <IconoPersona className="h-5 w-5 text-[#231a13]/50" />
                      <span>{numPersonas}</span>
                    </div>
                    <button
                      type="button"
                      disabled={numPersonas >= cuposMaximos}
                      onClick={() => setNumPersonas((n) => Math.min(cuposMaximos, n + 1))}
                      className="h-10 w-10 rounded-full border border-[#231a13]/20 bg-white font-bold text-lg text-[#231a13] hover:bg-[#faf5eb] disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de liquidación */}
            <div className="border-t border-[#231a13]/10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-[#231a13]/60">Total a liquidar</div>
                <div className="font-serif text-3xl font-bold text-[#792609]">
                  {paquete.moneda} {totalEstimado.toFixed(2)}
                </div>
                <div className="text-xs text-[#231a13]/50">
                  {numPersonas} plaza(s) a {paquete.moneda} {precioUnitario.toFixed(2)} c/u
                </div>
              </div>

              <Button
                onClick={avanzar}
                disabled={!salidaId || salidas.length === 0}
                className="flex items-center justify-center gap-2 rounded-full bg-[#792609] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#983d1f] disabled:opacity-50"
              >
                <span>Continuar a Pasajeros</span>
                <IconoFlechaDerecha className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

