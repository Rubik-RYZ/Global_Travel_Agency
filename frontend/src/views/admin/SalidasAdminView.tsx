import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { catalogoApi } from '@/api/catalogo'
import type {
  CrearSalidaPayload,
  Paquete,
  PaqueteSalida,
  Vuelo,
} from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoCerrar,
  IconoLapiz,
  IconoMas,
  IconoPortapapeles,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function SalidasAdminView() {
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [vuelos, setVuelos] = useState<Vuelo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [filtroPaquete, setFiltroPaquete] = useState('')

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<PaqueteSalida | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // Formulario
  const [formPaquete, setFormPaquete] = useState<number | ''>('')
  const [formFecha, setFormFecha] = useState('')
  const [formVueloIda, setFormVueloIda] = useState<number | ''>('')
  const [formVueloVuelta, setFormVueloVuelta] = useState<number | ''>('')
  const [formCuposTotales, setFormCuposTotales] = useState<number | ''>(20)
  const [formCuposDisponibles, setFormCuposDisponibles] = useState<number | ''>(20)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resSal, resPaq, resVue] = await Promise.all([
        catalogoApi.listarSalidas({
          paquete_id: filtroPaquete ? Number(filtroPaquete) : undefined,
        }),
        catalogoApi.listarPaquetes({ solo_activos: true }),
        catalogoApi.listarVuelos(),
      ])
      setSalidas(resSal.results || [])
      setPaquetes(resPaq.results || [])
      setVuelos(resVue.results || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroPaquete])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const abrirModalNuevo = () => {
    setEditando(null)
    setFormPaquete(paquetes[0]?.id || '')
    const d = new Date()
    d.setDate(d.getDate() + 30)
    setFormFecha(d.toISOString().slice(0, 10))
    setFormVueloIda('')
    setFormVueloVuelta('')
    setFormCuposTotales(20)
    setFormCuposDisponibles(20)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (s: PaqueteSalida) => {
    setEditando(s)
    setFormPaquete(s.paquete)
    setFormFecha(s.fecha_salida)
    setFormVueloIda(s.vuelo_ida || '')
    setFormVueloVuelta(s.vuelo_vuelta || '')
    setFormCuposTotales(s.cupos_totales)
    setFormCuposDisponibles(s.cupos_disponibles)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const guardarSalida = async (e: FormEvent) => {
    e.preventDefault()
    if (!formPaquete || !formFecha || !formCuposTotales) {
      setErrorForm('Completa los campos obligatorios.')
      return
    }
    if (Number(formCuposDisponibles) > Number(formCuposTotales)) {
      setErrorForm('Los cupos disponibles no pueden superar los totales.')
      return
    }
    if (formVueloIda && formVueloVuelta && formVueloIda === formVueloVuelta) {
      setErrorForm('El vuelo de vuelta debe ser diferente al de ida.')
      return
    }

    setOcupado(true)
    setErrorForm(null)
    try {
      const payload: CrearSalidaPayload = {
        paquete_id: Number(formPaquete),
        fecha_salida: formFecha,
        vuelo_ida_id: formVueloIda ? Number(formVueloIda) : null,
        vuelo_vuelta_id: formVueloVuelta ? Number(formVueloVuelta) : null,
        cupos_totales: Number(formCuposTotales),
        cupos_disponibles: Number(formCuposDisponibles),
      }

      if (editando) {
        await catalogoApi.actualizarSalida(editando.id, payload)
        setAviso(`Salida del ${formFecha} actualizada.`)
      } else {
        await catalogoApi.crearSalida(payload)
        setAviso(`Salida programada para el ${formFecha}.`)
      }
      setModalAbierto(false)
      cargarDatos()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const eliminarSalida = async (id: number, fecha: string) => {
    if (!confirm(`¿Eliminar la salida programada del ${fecha}?`)) return
    try {
      await catalogoApi.eliminarSalida(id)
      setAviso(`Salida del ${fecha} eliminada.`)
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
              <span>CU6 · Calendario y Disponibilidad</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
              Salidas Programadas y Control de Cupos
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Fechas de partida para paquetes turísticos, conexión con vuelos asociados e inventario de plazas.
            </p>
          </div>

          <Button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoMas className="h-4 w-4" />
            <span>Programar Salida</span>
          </Button>
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

      {/* Filtro por paquete */}
      <div className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 max-w-md">
        <label className="text-xs font-semibold uppercase text-[#231a13]/70">Filtrar por Paquete</label>
        <select
          value={filtroPaquete}
          onChange={(e) => setFiltroPaquete(e.target.value)}
          className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todas las expediciones</option>
          {paquetes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de salidas */}
      <div className="overflow-hidden rounded-xl border border-[#231a13]/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#231a13]/10 text-left text-sm">
          <thead className="bg-[#faf5eb] font-serif text-xs uppercase tracking-wider text-[#231a13]/70">
            <tr>
              <th className="px-4 py-3">Fecha de Salida</th>
              <th className="px-4 py-3">Paquete Turístico</th>
              <th className="px-4 py-3">Vuelo Ida</th>
              <th className="px-4 py-3">Vuelo Vuelta</th>
              <th className="px-4 py-3">Cupos (Disp / Tot)</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#231a13]/10">
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#231a13]/50">
                  Cargando calendario de salidas...
                </td>
              </tr>
            ) : salidas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#231a13]/50">
                  No se encontraron salidas programadas registradas.
                </td>
              </tr>
            ) : (
              salidas.map((s) => {
                const fechaFmt = new Date(s.fecha_salida + 'T00:00:00').toLocaleDateString('es-BO', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                const pct = s.cupos_totales > 0 ? (s.cupos_disponibles / s.cupos_totales) * 100 : 0

                return (
                  <tr key={s.id} className="hover:bg-[#faf5eb]/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-serif text-[#792609] capitalize">
                      {fechaFmt}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#231a13]">
                      {s.paquete_nombre || `Paquete #${s.paquete}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/70">
                      {s.vuelo_ida_detalle ? (
                        <span>
                          {s.vuelo_ida_detalle.numero_vuelo} ({s.vuelo_ida_detalle.origen_codigo} → {s.vuelo_ida_detalle.destino_codigo})
                        </span>
                      ) : (
                        <span className="italic text-[#231a13]/40">Sin vuelo ida</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/70">
                      {s.vuelo_vuelta_detalle ? (
                        <span>
                          {s.vuelo_vuelta_detalle.numero_vuelo} ({s.vuelo_vuelta_detalle.origen_codigo} → {s.vuelo_vuelta_detalle.destino_codigo})
                        </span>
                      ) : (
                        <span className="italic text-[#231a13]/40">Sin vuelo vuelta</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#231a13]">
                          {s.cupos_disponibles} / {s.cupos_totales}
                        </span>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            pct > 30 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirModalEditar(s)}
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-[#231a13]/10 hover:text-[#792609]"
                          title="Editar salida"
                        >
                          <IconoLapiz className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarSalida(s.id, s.fecha_salida)}
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-rose-50 hover:text-rose-600"
                          title="Eliminar salida"
                        >
                          <IconoCerrar className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo={editando ? `Editar Salida` : 'Programar Nueva Salida'}
        >
          <form onSubmit={guardarSalida} className="space-y-4">
            {errorForm && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorForm}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Paquete Turístico *</label>
              <select
                required
                value={formPaquete}
                onChange={(e) => setFormPaquete(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              >
                <option value="">Selecciona paquete...</option>
                {paquetes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.destino_nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Fecha de Partida *</label>
              <input
                type="date"
                required
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Vuelo de Ida</label>
                <select
                  value={formVueloIda}
                  onChange={(e) => setFormVueloIda(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Sin vuelo asignado</option>
                  {vuelos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.numero_vuelo} ({v.origen_codigo} → {v.destino_codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Vuelo de Vuelta</label>
                <select
                  value={formVueloVuelta}
                  onChange={(e) => setFormVueloVuelta(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Sin vuelo asignado</option>
                  {vuelos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.numero_vuelo} ({v.origen_codigo} → {v.destino_codigo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Cupos Totales *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formCuposTotales}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value)
                    setFormCuposTotales(val)
                    if (!editando) setFormCuposDisponibles(val)
                  }}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Cupos Disponibles *</label>
                <input
                  type="number"
                  min="0"
                  max={formCuposTotales || undefined}
                  required
                  value={formCuposDisponibles}
                  onChange={(e) => setFormCuposDisponibles(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#231a13]/10 pt-4">
              <Button
                type="button"
                variante="ghost"
                onClick={() => setModalAbierto(false)}
                disabled={ocupado}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={ocupado}
                className="bg-[#792609] text-white hover:bg-[#983d1f]"
              >
                {ocupado ? 'Guardando...' : editando ? 'Actualizar Salida' : 'Crear Salida'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
