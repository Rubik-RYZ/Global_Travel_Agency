import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { reservasApi } from '@/api/reservas'
import type { Itinerario, ItinerarioItem } from '@/types/reserva.types'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoCerrar,
  IconoLapiz,
  IconoMas,
  IconoPortapapeles,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function EditorItinerarioAdminView() {
  const { id } = useParams<{ id: string }>()
  const [itinerario, setItinerario] = useState<Itinerario | null>(null)
  const [items, setItems] = useState<ItinerarioItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Modal para agregar o editar un item
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditandoIdx, setItemEditandoIdx] = useState<number | null>(null)
  const [formDia, setFormDia] = useState(1)
  const [formHora, setFormHora] = useState('09:00')
  const [formTitulo, setFormTitulo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const data = await reservasApi.obtenerItinerarioPorReserva(Number(id))
      setItinerario(data)
      setItems(data.items || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirModalNuevo = (diaDefault = 1) => {
    setItemEditandoIdx(null)
    setFormDia(diaDefault)
    setFormHora('09:30')
    setFormTitulo('')
    setFormDescripcion('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (idx: number) => {
    const it = items[idx]
    if (!it) return
    setItemEditandoIdx(idx)
    setFormDia(it.dia)
    setFormHora(it.hora ? it.hora.slice(0, 5) : '09:00')
    setFormTitulo(it.titulo)
    setFormDescripcion(it.descripcion || '')
    setModalAbierto(true)
  }

  const guardarItem = (e: FormEvent) => {
    e.preventDefault()
    if (!formTitulo.trim()) return

    const nuevoItem: ItinerarioItem = {
      dia: Number(formDia),
      orden: 1,
      hora: formHora ? `${formHora}:00` : null,
      titulo: formTitulo.trim(),
      descripcion: formDescripcion.trim() || null,
    }

    setItems((prev) => {
      const copy = [...prev]
      if (itemEditandoIdx !== null) {
        copy[itemEditandoIdx] = nuevoItem
      } else {
        copy.push(nuevoItem)
      }
      return copy.sort((a, b) => (a.dia === b.dia ? (a.orden || 0) - (b.orden || 0) : a.dia - b.dia))
    })

    setModalAbierto(false)
  }

  const eliminarItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const guardarCambios = async () => {
    if (!itinerario) return
    setGuardando(true)
    setError(null)
    try {
      // Re-indexar orden secuencial por día
      const itemsConOrden = items.map((it, idx) => ({
        ...it,
        orden: idx + 1,
      }))
      const actualizado = await reservasApi.editarActividadesItinerario(itinerario.id, itemsConOrden)
      setItinerario(actualizado)
      setItems(actualizado.items || [])
      setAviso('Itinerario personalizado guardado correctamente.')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="py-16 text-center text-[#231a13]/50">Cargando editor de itinerario...</div>
  }

  if (error || !itinerario) {
    return (
      <div className="py-16 text-center">
        <h2 className="font-serif text-xl font-bold text-[#792609]">No se pudo cargar el itinerario</h2>
        <Link to="/admin/reservas" className="mt-4 inline-block text-xs font-semibold text-[#792609]">
          ← Volver a reservas
        </Link>
      </div>
    )
  }

  // Agrupar items por día
  const itemsPorDia = items.reduce<Record<number, { item: ItinerarioItem; idx: number }[]>>((acc, it, idx) => {
    if (!acc[it.dia]) acc[it.dia] = []
    acc[it.dia].push({ item: it, idx })
    return acc
  }, {})

  const diasOrdenados = Object.keys(itemsPorDia)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      <header className="border-b border-[#231a13]/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={`/admin/reservas/${id}`} className="text-xs uppercase font-semibold text-[#792609] hover:underline block mb-2">
            ← Volver al expediente de la reserva
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
            <IconoPortapapeles className="h-4 w-4" />
            <span>CU8 · Personalización de Itinerario</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
            Editor de Itinerario · {itinerario.reserva_codigo || `Reserva #${id}`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => abrirModalNuevo(diasOrdenados.length > 0 ? diasOrdenados[diasOrdenados.length - 1] : 1)}
            variante="ghost"
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <IconoMas className="h-4 w-4" />
            <span>Agregar Actividad</span>
          </Button>

          <Button
            onClick={guardarCambios}
            disabled={guardando}
            className="bg-[#792609] text-white hover:bg-[#983d1f] text-xs font-semibold"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </header>

      {aviso && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          {aviso}
        </div>
      )}

      {diasOrdenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#231a13]/20 bg-white p-12 text-center text-sm text-[#231a13]/50">
          El itinerario está vacío. Comienza agregando la primera actividad del viaje.
        </div>
      ) : (
        <div className="space-y-6">
          {diasOrdenados.map((diaNum) => (
            <div key={diaNum} className="rounded-2xl border border-[#231a13]/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#231a13]/10 pb-3">
                <h2 className="font-serif font-bold text-lg text-[#231a13]">
                  Día {diaNum} de Expedición
                </h2>
                <button
                  onClick={() => abrirModalNuevo(diaNum)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#792609] hover:underline"
                >
                  <IconoMas className="h-3.5 w-3.5" />
                  <span>Actividad en Día {diaNum}</span>
                </button>
              </div>

              <div className="space-y-3">
                {itemsPorDia[diaNum].map(({ item: it, idx }) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-xl border border-[#231a13]/10 bg-[#faf5eb]/50 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {it.hora && (
                          <span className="font-mono text-xs font-bold text-[#792609] bg-white px-2 py-0.5 rounded border border-[#231a13]/10">
                            {it.hora.slice(0, 5)}
                          </span>
                        )}
                        <span className="font-serif font-bold text-sm text-[#231a13]">{it.titulo}</span>
                      </div>
                      {it.descripcion && (
                        <p className="mt-1.5 text-xs text-[#231a13]/70">{it.descripcion}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirModalEditar(idx)}
                        className="rounded p-1 text-[#231a13]/60 hover:text-[#792609]"
                        title="Editar actividad"
                      >
                        <IconoLapiz className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarItem(idx)}
                        className="rounded p-1 text-[#231a13]/60 hover:text-rose-600"
                        title="Eliminar actividad"
                      >
                        <IconoCerrar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Actividad */}
      {modalAbierto && (
        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo={itemEditandoIdx !== null ? 'Editar Actividad' : 'Nueva Actividad'}
        >
          <form onSubmit={guardarItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Día de Viaje *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formDia}
                  onChange={(e) => setFormDia(Math.max(1, Number(e.target.value)))}
                  className="mt-1 w-full rounded border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Hora Estimada</label>
                <input
                  type="time"
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="mt-1 w-full rounded border border-[#231a13]/20 p-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Título de la Actividad *</label>
              <input
                type="text"
                required
                placeholder="Ej. Caminata al mirador, Cena de gala..."
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                className="mt-1 w-full rounded border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Descripción / Detalles</label>
              <textarea
                rows={3}
                placeholder="Indicaciones para los viajeros, transporte incluido..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                className="mt-1 w-full rounded border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#231a13]/10">
              <Button type="button" variante="ghost" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#792609] text-white hover:bg-[#983d1f]">
                {itemEditandoIdx !== null ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

