import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { catalogoApi, type DestinoResumen } from '@/api/catalogo'
import type {
  CrearHabitacionPayload,
  CrearHotelPayload,
  Habitacion,
  Hotel,
  Proveedor,
} from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoCerrar,
  IconoEdificio,
  IconoLapiz,
  IconoLupa,
  IconoMaletin,
  IconoMas,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function HotelesAdminView() {
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [destinos, setDestinos] = useState<DestinoResumen[]>([])
  const [proveedoresHotel, setProveedoresHotel] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Filtros
  const [filtroDestino, setFiltroDestino] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Hotel seleccionado para ver/administrar habitaciones
  const [hotelSeleccionado, setHotelSeleccionado] = useState<Hotel | null>(null)
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false)

  // Modal Hotel
  const [modalHotelAbierto, setModalHotelAbierto] = useState(false)
  const [editandoHotel, setEditandoHotel] = useState<Hotel | null>(null)
  const [errorHotel, setErrorHotel] = useState<string | null>(null)
  const [formHotelProveedor, setFormHotelProveedor] = useState<number | ''>('')
  const [formHotelDestino, setFormHotelDestino] = useState<number | ''>('')
  const [formHotelNombre, setFormHotelNombre] = useState('')
  const [formHotelEstrellas, setFormHotelEstrellas] = useState<number | ''>(4)
  const [formHotelDireccion, setFormHotelDireccion] = useState('')
  const [formHotelDescripcion, setFormHotelDescripcion] = useState('')
  const [formHotelActivo, setFormHotelActivo] = useState(true)

  // Modal Habitación
  const [modalHabAbierto, setModalHabAbierto] = useState(false)
  const [editandoHab, setEditandoHab] = useState<Habitacion | null>(null)
  const [errorHab, setErrorHab] = useState<string | null>(null)
  const [formHabTipo, setFormHabTipo] = useState('')
  const [formHabCapacidad, setFormHabCapacidad] = useState<number | ''>(2)
  const [formHabPrecio, setFormHabPrecio] = useState<number | ''>(120)
  const [formHabMoneda, setFormHabMoneda] = useState<'USD' | 'BOB' | 'EUR'>('USD')

  const [ocupado, setOcupado] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resHoteles, resDest, resProv] = await Promise.all([
        catalogoApi.listarHoteles({
          destino_id: filtroDestino ? Number(filtroDestino) : undefined,
          proveedor_id: filtroProveedor ? Number(filtroProveedor) : undefined,
          q: busqueda || undefined,
        }),
        catalogoApi.listarDestinos(),
        catalogoApi.listarProveedores({ tipo: 'hotel' }),
      ])
      setHoteles(resHoteles.results || [])
      setDestinos(resDest.results || [])
      setProveedoresHotel((resProv.results || []) as unknown as Proveedor[])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroDestino, filtroProveedor, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const cargarHabitaciones = useCallback(async (hotelId: number) => {
    setCargandoHabitaciones(true)
    try {
      const res = await catalogoApi.listarHabitaciones(hotelId)
      setHabitaciones(res.results || [])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargandoHabitaciones(false)
    }
  }, [])

  const seleccionarHotel = (hotel: Hotel) => {
    setHotelSeleccionado(hotel)
    cargarHabitaciones(hotel.id)
  }

  // Manejo Hotel
  const abrirModalNuevoHotel = () => {
    setEditandoHotel(null)
    setFormHotelProveedor(proveedoresHotel[0]?.id || '')
    setFormHotelDestino(destinos[0]?.id || '')
    setFormHotelNombre('')
    setFormHotelEstrellas(4)
    setFormHotelDireccion('')
    setFormHotelDescripcion('')
    setFormHotelActivo(true)
    setErrorHotel(null)
    setModalHotelAbierto(true)
  }

  const abrirModalEditarHotel = (h: Hotel) => {
    setEditandoHotel(h)
    setFormHotelProveedor(h.proveedor)
    setFormHotelDestino(h.destino)
    setFormHotelNombre(h.nombre)
    setFormHotelEstrellas(h.estrellas || 3)
    setFormHotelDireccion(h.direccion || '')
    setFormHotelDescripcion(h.descripcion || '')
    setFormHotelActivo(h.activo)
    setErrorHotel(null)
    setModalHotelAbierto(true)
  }

  const guardarHotel = async (e: FormEvent) => {
    e.preventDefault()
    if (!formHotelProveedor || !formHotelDestino || !formHotelNombre) {
      setErrorHotel('Completa los campos obligatorios.')
      return
    }
    setOcupado(true)
    setErrorHotel(null)
    try {
      const payload: CrearHotelPayload = {
        proveedor_id: Number(formHotelProveedor),
        destino_id: Number(formHotelDestino),
        nombre: formHotelNombre.trim(),
        estrellas: formHotelEstrellas ? Number(formHotelEstrellas) : null,
        direccion: formHotelDireccion.trim() || undefined,
        descripcion: formHotelDescripcion.trim() || undefined,
        activo: formHotelActivo,
      }
      if (editandoHotel) {
        await catalogoApi.actualizarHotel(editandoHotel.id, payload)
        setAviso(`Hotel ${payload.nombre} actualizado.`)
      } else {
        await catalogoApi.crearHotel(payload)
        setAviso(`Hotel ${payload.nombre} registrado.`)
      }
      setModalHotelAbierto(false)
      cargarDatos()
    } catch (err) {
      setErrorHotel(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const eliminarHotel = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar hotel "${nombre}" y sus tipologías de habitación?`)) return
    try {
      await catalogoApi.eliminarHotel(id)
      setAviso(`Hotel "${nombre}" eliminado.`)
      if (hotelSeleccionado?.id === id) {
        setHotelSeleccionado(null)
        setHabitaciones([])
      }
      cargarDatos()
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  // Manejo Habitación
  const abrirModalNuevaHab = () => {
    if (!hotelSeleccionado) return
    setEditandoHab(null)
    setFormHabTipo('Doble Estándar')
    setFormHabCapacidad(2)
    setFormHabPrecio(130)
    setFormHabMoneda('USD')
    setErrorHab(null)
    setModalHabAbierto(true)
  }

  const abrirModalEditarHab = (hab: Habitacion) => {
    setEditandoHab(hab)
    setFormHabTipo(hab.tipo)
    setFormHabCapacidad(hab.capacidad)
    setFormHabPrecio(Number(hab.precio_noche))
    setFormHabMoneda(hab.moneda)
    setErrorHab(null)
    setModalHabAbierto(true)
  }

  const guardarHabitacion = async (e: FormEvent) => {
    e.preventDefault()
    if (!hotelSeleccionado || !formHabTipo) return
    setOcupado(true)
    setErrorHab(null)
    try {
      const payload: CrearHabitacionPayload = {
        hotel_id: hotelSeleccionado.id,
        tipo: formHabTipo.trim(),
        capacidad: Number(formHabCapacidad),
        precio_noche: Number(formHabPrecio),
        moneda: formHabMoneda,
      }
      if (editandoHab) {
        await catalogoApi.actualizarHabitacion(editandoHab.id, payload)
        setAviso(`Habitación "${payload.tipo}" actualizada.`)
      } else {
        await catalogoApi.crearHabitacion(payload)
        setAviso(`Habitación "${payload.tipo}" añadida a ${hotelSeleccionado.nombre}.`)
      }
      setModalHabAbierto(false)
      cargarHabitaciones(hotelSeleccionado.id)
      cargarDatos()
    } catch (err) {
      setErrorHab(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const eliminarHabitacion = async (id: number, tipo: string) => {
    if (!confirm(`¿Eliminar habitación "${tipo}"?`)) return
    try {
      await catalogoApi.eliminarHabitacion(id)
      setAviso(`Habitación eliminada.`)
      if (hotelSeleccionado) {
        cargarHabitaciones(hotelSeleccionado.id)
      }
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
              <IconoEdificio className="h-4 w-4" />
              <span>CU5 · Hoteles y Hospedajes</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
              Gestión de Hoteles y Habitaciones
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Padrón de alojamientos asociados a destinos y configuración de habitaciones por estancia.
            </p>
          </div>

          <Button
            onClick={abrirModalNuevoHotel}
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoMas className="h-4 w-4" />
            <span>Registrar Hotel</span>
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

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Cadena / Proveedor</label>
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los proveedores</option>
            {proveedoresHotel.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Búsqueda rápida</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Buscar por hotel, ciudad o calle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border border-[#231a13]/20 bg-white pl-8 pr-3 py-1.5 text-sm"
            />
            <IconoLupa className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#231a13]/40" />
          </div>
        </div>
      </div>

      {/* Grilla: Hoteles y Panel de Habitaciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de Hoteles */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-[#231a13]/10 bg-white shadow-sm">
          <div className="border-b border-[#231a13]/10 bg-[#faf5eb] px-4 py-3 font-serif font-semibold text-[#231a13]">
            Catálogo de Alojamientos ({hoteles.length})
          </div>
          <div className="divide-y divide-[#231a13]/10 max-h-[600px] overflow-y-auto">
            {cargando ? (
              <div className="p-8 text-center text-[#231a13]/50">Cargando hoteles...</div>
            ) : hoteles.length === 0 ? (
              <div className="p-8 text-center text-[#231a13]/50">No se encontraron hoteles registrados.</div>
            ) : (
              hoteles.map((h) => {
                const esActivo = hotelSeleccionado?.id === h.id
                return (
                  <div
                    key={h.id}
                    onClick={() => seleccionarHotel(h)}
                    className={`cursor-pointer p-4 transition-colors ${
                      esActivo ? 'bg-[#792609]/5 border-l-4 border-[#792609]' : 'hover:bg-[#faf5eb]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-[#231a13]">{h.nombre}</h3>
                          {h.estrellas && (
                            <span className="text-xs text-amber-600">
                              {'★'.repeat(h.estrellas)}
                            </span>
                          )}
                          {!h.activo && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#231a13]/70">
                          <span className="flex items-center gap-1">
                            <IconoUbicacion className="h-3 w-3 text-[#792609]" />
                            {h.destino_nombre}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <IconoMaletin className="h-3 w-3 text-[#231a13]/50" />
                            {h.proveedor_nombre}
                          </span>
                        </div>
                        {h.direccion && (
                          <div className="mt-1 text-xs text-[#231a13]/60 italic">{h.direccion}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => abrirModalEditarHotel(h)}
                          title="Editar hotel"
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-[#231a13]/10 hover:text-[#792609]"
                        >
                          <IconoLapiz className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarHotel(h.id, h.nombre)}
                          title="Eliminar hotel"
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <IconoCerrar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel lateral de Habitaciones del Hotel Seleccionado */}
        <div className="rounded-xl border border-[#231a13]/10 bg-white p-5 shadow-sm">
          {hotelSeleccionado ? (
            <div>
              <div className="flex items-center justify-between border-b border-[#231a13]/10 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#231a13]">
                    {hotelSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-[#231a13]/60">Tipologías de habitación</p>
                </div>
                <Button
                  tamano="sm"
                  onClick={abrirModalNuevaHab}
                  className="rounded-full bg-[#792609] text-white hover:bg-[#983d1f]"
                >
                  <IconoMas className="h-3.5 w-3.5" />
                  <span>Habitación</span>
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {cargandoHabitaciones ? (
                  <div className="py-6 text-center text-xs text-[#231a13]/50">Cargando habitaciones...</div>
                ) : habitaciones.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#231a13]/50">
                    Este hotel aún no tiene tipologías de habitación registradas.
                  </div>
                ) : (
                  habitaciones.map((hab) => (
                    <div
                      key={hab.id}
                      className="flex items-center justify-between rounded-lg border border-[#231a13]/10 bg-[#faf5eb]/50 p-3"
                    >
                      <div>
                        <div className="font-medium text-sm text-[#231a13]">{hab.tipo}</div>
                        <div className="text-xs text-[#231a13]/60">
                          Capacidad: {hab.capacidad} {hab.capacidad === 1 ? 'persona' : 'personas'}
                        </div>
                        <div className="text-xs font-semibold text-[#792609]">
                          {hab.moneda} {Number(hab.precio_noche).toFixed(2)} / noche
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirModalEditarHab(hab)}
                          className="rounded p-1 text-[#231a13]/60 hover:text-[#792609]"
                        >
                          <IconoLapiz className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => eliminarHabitacion(hab.id, hab.tipo)}
                          className="rounded p-1 text-[#231a13]/60 hover:text-rose-600"
                        >
                          <IconoCerrar className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[#231a13]/50">
              Selecciona un hotel de la lista para gestionar sus habitaciones y tarifas por noche.
            </div>
          )}
        </div>
      </div>

      {/* Modal Hotel */}
      {modalHotelAbierto && (
        <Modal
          abierto={modalHotelAbierto}
          onCerrar={() => setModalHotelAbierto(false)}
          titulo={editandoHotel ? `Editar Hotel ${editandoHotel.nombre}` : 'Registrar Nuevo Hotel'}
        >
          <form onSubmit={guardarHotel} className="space-y-4">
            {errorHotel && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorHotel}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Cadena / Proveedor *</label>
                <select
                  required
                  value={formHotelProveedor}
                  onChange={(e) => setFormHotelProveedor(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona proveedor...</option>
                  {proveedoresHotel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Destino Turístico *</label>
                <select
                  required
                  value={formHotelDestino}
                  onChange={(e) => setFormHotelDestino(Number(e.target.value))}
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
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Nombre del Hotel *</label>
              <input
                type="text"
                required
                placeholder="Ej. Palacio Manco Cápac Luxury Lodge"
                value={formHotelNombre}
                onChange={(e) => setFormHotelNombre(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Categoría (Estrellas)</label>
                <select
                  value={formHotelEstrellas}
                  onChange={(e) => setFormHotelEstrellas(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Sin categoría asignada</option>
                  <option value="1">1 Estrella ★</option>
                  <option value="2">2 Estrellas ★★</option>
                  <option value="3">3 Estrellas ★★★</option>
                  <option value="4">4 Estrellas ★★★★</option>
                  <option value="5">5 Estrellas ★★★★★</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle, número, zona o barrio"
                  value={formHotelDireccion}
                  onChange={(e) => setFormHotelDireccion(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Descripción / Servicios</label>
              <textarea
                rows={3}
                placeholder="Detalle sobre amenidades, encanto patrimonial, vistas panorámicas..."
                value={formHotelDescripcion}
                onChange={(e) => setFormHotelDescripcion(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hotelActivo"
                checked={formHotelActivo}
                onChange={(e) => setFormHotelActivo(e.target.checked)}
                className="rounded border-[#231a13]/20 text-[#792609]"
              />
              <label htmlFor="hotelActivo" className="text-sm text-[#231a13]">
                Hotel activo y habilitado para paquetes turísticos
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#231a13]/10 pt-4">
              <Button
                type="button"
                variante="ghost"
                onClick={() => setModalHotelAbierto(false)}
                disabled={ocupado}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={ocupado}
                className="bg-[#792609] text-white hover:bg-[#983d1f]"
              >
                {ocupado ? 'Guardando...' : editandoHotel ? 'Actualizar Hotel' : 'Registrar Hotel'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Habitación */}
      {modalHabAbierto && (
        <Modal
          abierto={modalHabAbierto}
          onCerrar={() => setModalHabAbierto(false)}
          titulo={editandoHab ? `Editar Habitación` : `Nueva Habitación en ${hotelSeleccionado?.nombre}`}
        >
          <form onSubmit={guardarHabitacion} className="space-y-4">
            {errorHab && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorHab}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Tipo de Habitación *</label>
              <input
                type="text"
                required
                placeholder="Ej. Simple, Doble King, Suite Colonial, Familiar"
                value={formHabTipo}
                onChange={(e) => setFormHabTipo(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Capacidad (Pax) *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formHabCapacidad}
                  onChange={(e) => setFormHabCapacidad(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Precio Noche *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formHabPrecio}
                  onChange={(e) => setFormHabPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Moneda *</label>
                <select
                  value={formHabMoneda}
                  onChange={(e) => setFormHabMoneda(e.target.value as 'USD' | 'BOB' | 'EUR')}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BOB">BOB (Bs.)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#231a13]/10 pt-4">
              <Button
                type="button"
                variante="ghost"
                onClick={() => setModalHabAbierto(false)}
                disabled={ocupado}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={ocupado}
                className="bg-[#792609] text-white hover:bg-[#983d1f]"
              >
                {ocupado ? 'Guardando...' : editandoHab ? 'Guardar Cambios' : 'Crear Habitación'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
