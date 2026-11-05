import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'
import type {
  CrearPaquetePayload,
  Hotel,
  Paquete,
} from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoCerrar,
  IconoEdificio,
  IconoLapiz,
  IconoLupa,
  IconoMas,
  IconoPortapapeles,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function PaquetesAdminView() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [filtroDestino, setFiltroDestino] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Paquete | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // Formulario
  const [formDestino, setFormDestino] = useState<number | ''>('')
  const [formHotel, setFormHotel] = useState<number | ''>('')
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formDuracion, setFormDuracion] = useState<number | ''>(5)
  const [formPrecioBase, setFormPrecioBase] = useState<number | ''>(450)
  const [formMoneda, setFormMoneda] = useState<'USD' | 'BOB' | 'EUR'>('USD')
  const [formEtiquetas, setFormEtiquetas] = useState('')
  const [formActivo, setFormActivo] = useState(true)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resPaq, resDest, resHot] = await Promise.all([
        catalogoApi.listarPaquetes({
          destino_id: filtroDestino ? Number(filtroDestino) : undefined,
          q: busqueda || undefined,
        }),
        catalogoApi.listarDestinos(),
        catalogoApi.listarHoteles({ solo_activos: true }),
      ])
      setPaquetes(resPaq.results || [])
      setDestinos(resDest.results || [])
      setHoteles(resHot.results || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroDestino, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const abrirModalNuevo = () => {
    setEditando(null)
    setFormDestino(destinos[0]?.id || '')
    setFormHotel('')
    setFormNombre('')
    setFormDescripcion('')
    setFormDuracion(5)
    setFormPrecioBase(450)
    setFormMoneda('USD')
    setFormEtiquetas('arqueologia, andino, expedicion')
    setFormActivo(true)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (p: Paquete) => {
    setEditando(p)
    setFormDestino(p.destino)
    setFormHotel(p.hotel || '')
    setFormNombre(p.nombre)
    setFormDescripcion(p.descripcion || '')
    setFormDuracion(p.duracion_dias)
    setFormPrecioBase(Number(p.precio_base))
    setFormMoneda(p.moneda)
    setFormEtiquetas(p.etiquetas ? p.etiquetas.join(', ') : '')
    setFormActivo(p.activo)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const guardarPaquete = async (e: FormEvent) => {
    e.preventDefault()
    if (!formDestino || !formNombre || !formDuracion || !formPrecioBase) {
      setErrorForm('Completa los campos requeridos.')
      return
    }
    setOcupado(true)
    setErrorForm(null)
    try {
      const etiquetasArray = formEtiquetas
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)

      const payload: CrearPaquetePayload = {
        destino_id: Number(formDestino),
        hotel_id: formHotel ? Number(formHotel) : null,
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
        duracion_dias: Number(formDuracion),
        precio_base: Number(formPrecioBase),
        moneda: formMoneda,
        etiquetas: etiquetasArray,
        activo: formActivo,
      }

      if (editando) {
        await catalogoApi.actualizarPaquete(editando.id, payload)
        setAviso(`Paquete "${payload.nombre}" actualizado.`)
      } else {
        await catalogoApi.crearPaquete(payload)
        setAviso(`Paquete "${payload.nombre}" creado exitosamente.`)
      }
      setModalAbierto(false)
      cargarDatos()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const eliminarPaquete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar paquete "${nombre}"?`)) return
    try {
      await catalogoApi.eliminarPaquete(id)
      setAviso(`Paquete "${nombre}" eliminado.`)
      cargarDatos()
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  // Filtrar hoteles por el destino seleccionado en el formulario
  const hotelesDisponibles = formDestino
    ? hoteles.filter((h) => h.destino === Number(formDestino))
    : hoteles

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <header className="border-b border-[#231a13]/10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
              <IconoPortapapeles className="h-4 w-4" />
              <span>CU6 · Paquetes y Productos Turísticos</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
              Armador y Catálogo de Paquetes
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Configuración de paquetes turísticos que integran destinos, hoteles, precios base y duración.
            </p>
          </div>

          <Button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoMas className="h-4 w-4" />
            <span>Crear Paquete</span>
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

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Destino</label>
          <select
            value={filtroDestino}
            onChange={(e) => setFiltroDestino(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los destinos</option>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.pais})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Búsqueda</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Buscar por nombre, destino o etiqueta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border border-[#231a13]/20 bg-white pl-8 pr-3 py-1.5 text-sm"
            />
            <IconoLupa className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#231a13]/40" />
          </div>
        </div>
      </div>

      {/* Tabla de paquetes */}
      <div className="overflow-hidden rounded-xl border border-[#231a13]/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#231a13]/10 text-left text-sm">
          <thead className="bg-[#faf5eb] font-serif text-xs uppercase tracking-wider text-[#231a13]/70">
            <tr>
              <th className="px-4 py-3">Paquete</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Hospedaje Asociado</th>
              <th className="px-4 py-3">Duración</th>
              <th className="px-4 py-3">Tarifa Base</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#231a13]/10">
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#231a13]/50">
                  Cargando paquetes turísticos...
                </td>
              </tr>
            ) : paquetes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#231a13]/50">
                  No se encontraron paquetes registrados.
                </td>
              </tr>
            ) : (
              paquetes.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf5eb]/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-[#231a13]">
                    <div className="font-serif font-bold text-base text-[#231a13]">{p.nombre}</div>
                    {p.etiquetas && p.etiquetas.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.etiquetas.slice(0, 3).map((t, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-[#231a13]/5 text-[#231a13]/70 px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[#231a13]/80">
                    <div className="flex items-center gap-1.5">
                      <IconoUbicacion className="h-3.5 w-3.5 text-[#792609]" />
                      <span>{p.destino_nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#231a13]/70">
                    {p.hotel_nombre ? (
                      <div className="flex items-center gap-1">
                        <IconoEdificio className="h-3.5 w-3.5 text-[#231a13]/40" />
                        <span>{p.hotel_nombre}</span>
                      </div>
                    ) : (
                      <span className="italic text-[#231a13]/40">Sin hotel asignado</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#141d16]">
                    {p.duracion_dias} días
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#792609]">
                    {p.moneda} {Number(p.precio_base).toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.activo ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => abrirModalEditar(p)}
                        className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-[#231a13]/10 hover:text-[#792609]"
                        title="Editar paquete"
                      >
                        <IconoLapiz className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarPaquete(p.id, p.nombre)}
                        className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-rose-50 hover:text-rose-600"
                        title="Eliminar paquete"
                      >
                        <IconoCerrar className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo={editando ? `Editar Paquete` : 'Diseñar Nuevo Paquete Turístico'}
        >
          <form onSubmit={guardarPaquete} className="space-y-4">
            {errorForm && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorForm}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Nombre de la Expedición *</label>
              <input
                type="text"
                required
                placeholder="Ej. Joyas del Valle Sagrado y Machu Picchu"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Destino *</label>
                <select
                  required
                  value={formDestino}
                  onChange={(e) => setFormDestino(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona destino...</option>
                  {destinos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d.pais})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Hotel Principal</label>
                <select
                  value={formHotel}
                  onChange={(e) => setFormHotel(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Opcional / Ninguno</option>
                  {hotelesDisponibles.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Duración (Días) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formDuracion}
                  onChange={(e) => setFormDuracion(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Tarifa Base (Pax) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formPrecioBase}
                  onChange={(e) => setFormPrecioBase(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Moneda *</label>
                <select
                  value={formMoneda}
                  onChange={(e) => setFormMoneda(e.target.value as 'USD' | 'BOB' | 'EUR')}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BOB">BOB (Bs.)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Etiquetas (separadas por coma)</label>
              <input
                type="text"
                placeholder="naturaleza, trekking, arqueologia, historia"
                value={formEtiquetas}
                onChange={(e) => setFormEtiquetas(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Descripción / Enfoque</label>
              <textarea
                rows={3}
                placeholder="Propuesta editorial, momentos cumbre del recorrido..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paqActivo"
                checked={formActivo}
                onChange={(e) => setFormActivo(e.target.checked)}
                className="rounded border-[#231a13]/20 text-[#792609]"
              />
              <label htmlFor="paqActivo" className="text-sm text-[#231a13]">
                Publicar paquete en el catálogo de expediciones
              </label>
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
                {ocupado ? 'Guardando...' : editando ? 'Actualizar Paquete' : 'Crear Paquete'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

