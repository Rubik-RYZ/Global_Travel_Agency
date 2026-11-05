import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Reserva } from '@/types/reserva.types'
import {
  IconoCerrar,
  IconoFlechaDerecha,
  IconoLupa,
  IconoMas,
  IconoPortapapeles,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function ReservasAdminView() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCanal, setFiltroCanal] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await reservasApi.listarReservas({
        estado: filtroEstado || undefined,
        canal: filtroCanal || undefined,
        q: busqueda || undefined,
      })
      setReservas(res.results || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroCanal, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const cancelar = async (id: number, codigo: string) => {
    if (!confirm(`¿Confirmas la cancelación de la reserva ${codigo}? Se reintegrarán las plazas al inventario.`)) return
    try {
      await reservasApi.cancelarReserva(id)
      setAviso(`Reserva ${codigo} cancelada y cupos liberados.`)
      cargarDatos()
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <header className="border-b border-[#231a13]/10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
              <IconoPortapapeles className="h-4 w-4" />
              <span>CU7 · Gestión y Mesa de Reservas</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
              Mesa de Control de Reservas
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Expedientes de viaje, control de viajeros y supervisión de cupos en tiempo real.
            </p>
          </div>

          <Link
            to="/admin/reservas/nueva"
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoMas className="h-4 w-4" />
            <span>Reserva Presencial</span>
          </Link>
        </div>
      </header>

      {/* Avisos */}
      {aviso && (
        <div className="flex items-center justify-between rounded-lg border border-[#1b261d]/20 bg-[#1b261d]/5 px-4 py-3 text-sm text-[#141d16]">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="text-[#141d16]/70 hover:text-[#141d16]">
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Canal</label>
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los canales</option>
            <option value="web">Web</option>
            <option value="agente">Chatbot IA</option>
            <option value="personal">Mostrador / Personal</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Búsqueda rápida</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Código, cliente, documento o viaje..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border border-[#231a13]/20 bg-white pl-8 pr-3 py-1.5 text-sm"
            />
            <IconoLupa className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#231a13]/40" />
          </div>
        </div>
      </div>

      {/* Tabla de reservas */}
      <div className="overflow-hidden rounded-xl border border-[#231a13]/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#231a13]/10 text-left text-sm">
          <thead className="bg-[#faf5eb] font-serif text-xs uppercase tracking-wider text-[#231a13]/70">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente / Titular</th>
              <th className="px-4 py-3">Expedición</th>
              <th className="px-4 py-3">Salida</th>
              <th className="px-4 py-3">Plazas</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#231a13]/10">
            {cargando ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[#231a13]/50">
                  Cargando mesa de reservas...
                </td>
              </tr>
            ) : reservas.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[#231a13]/50">
                  No se registraron reservas con esos criterios.
                </td>
              </tr>
            ) : (
              reservas.map((r) => {
                const salidaFmt = r.fecha_salida
                  ? new Date(r.fecha_salida + 'T00:00:00').toLocaleDateString('es-BO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'

                return (
                  <tr key={r.id} className="hover:bg-[#faf5eb]/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#792609]">
                      <Link to={`/admin/reservas/${r.id}`} className="hover:underline">
                        {r.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#231a13]">
                      {r.cliente_nombre || `Cliente #${r.cliente}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/80">
                      <div>{r.paquete_nombre}</div>
                      <div className="text-[11px] text-[#231a13]/50">{r.destino_nombre}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/80 capitalize">
                      {salidaFmt}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#141d16]">
                      {r.num_personas} pax
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#792609]">
                      {r.moneda} {Number(r.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
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
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/60 capitalize">
                      {r.canal}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/reservas/${r.id}`}
                          className="rounded p-1.5 text-[#231a13]/60 hover:text-[#792609]"
                          title="Ver detalle"
                        >
                          <IconoFlechaDerecha className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/reservas/${r.id}/itinerario`}
                          className="rounded p-1.5 text-[#231a13]/60 hover:text-[#792609]"
                          title="Editar itinerario"
                        >
                          <IconoPortapapeles className="h-4 w-4" />
                        </Link>
                        {r.estado !== 'cancelada' && (
                          <button
                            onClick={() => cancelar(r.id, r.codigo)}
                            className="rounded p-1.5 text-[#231a13]/60 hover:text-rose-600"
                            title="Cancelar reserva"
                          >
                            <IconoCerrar className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

