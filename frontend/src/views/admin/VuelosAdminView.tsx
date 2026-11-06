import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { catalogoApi } from '@/api/catalogo'
import type { Aeropuerto, CrearVueloPayload, Proveedor, Vuelo } from '@/types/catalogo.types'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import {
  IconoCerrar,
  IconoLapiz,
  IconoLupa,
  IconoMaletin,
  IconoMas,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function VuelosAdminView() {
  const [vuelos, setVuelos] = useState<Vuelo[]>([])
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([])
  const [aerolineas, setAerolineas] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Filtros
  const [filtroOrigen, setFiltroOrigen] = useState('')
  const [filtroDestino, setFiltroDestino] = useState('')
  const [filtroAerolinea, setFiltroAerolinea] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')

  // Modal formulario
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Vuelo | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // Campos del formulario
  const [formProveedorId, setFormProveedorId] = useState<number | ''>('')
  const [formNumero, setFormNumero] = useState('')
  const [formOrigen, setFormOrigen] = useState('')
  const [formDestino, setFormDestino] = useState('')
  const [formSalida, setFormSalida] = useState('')
  const [formLlegada, setFormLlegada] = useState('')
  const [formPrecio, setFormPrecio] = useState<number | ''>('')
  const [formMoneda, setFormMoneda] = useState<'USD' | 'BOB' | 'EUR'>('USD')
  const [formCuposTotales, setFormCuposTotales] = useState<number | ''>('')
  const [formCuposDisponibles, setFormCuposDisponibles] = useState<number | ''>('')
  const [formRefExterna, setFormRefExterna] = useState('')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resVuelos, resAero, resProv] = await Promise.all([
        catalogoApi.listarVuelos({
          origen: filtroOrigen || undefined,
          destino: filtroDestino || undefined,
          proveedor_id: filtroAerolinea ? Number(filtroAerolinea) : undefined,
          q: busqueda || undefined,
        }),
        catalogoApi.listarAeropuertos(),
        catalogoApi.listarProveedores({ tipo: 'aerolinea' }),
      ])
      setVuelos(resVuelos.results || [])
      setAeropuertos(resAero.results || [])
      setAerolineas((resProv.results || []) as unknown as Proveedor[])
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [filtroOrigen, filtroDestino, filtroAerolinea, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const abrirModalNuevo = () => {
    setEditando(null)
    setFormProveedorId(aerolineas[0]?.id || '')
    setFormNumero('')
    setFormOrigen(aeropuertos[0]?.codigo_iata || '')
    setFormDestino(aeropuertos[1]?.codigo_iata || '')
    const ahora = new Date()
    ahora.setDate(ahora.getDate() + 7)
    ahora.setHours(10, 0, 0, 0)
    const salidaIso = ahora.toISOString().slice(0, 16)
    ahora.setHours(13, 30, 0, 0)
    const llegadaIso = ahora.toISOString().slice(0, 16)
    setFormSalida(salidaIso)
    setFormLlegada(llegadaIso)
    setFormPrecio(180)
    setFormMoneda('USD')
    setFormCuposTotales(45)
    setFormCuposDisponibles(45)
    setFormRefExterna('')
    setErrorForm(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (v: Vuelo) => {
    setEditando(v)
    setFormProveedorId(v.proveedor)
    setFormNumero(v.numero_vuelo)
    setFormOrigen(v.origen_codigo || (typeof v.origen === 'string' ? v.origen : ''))
    setFormDestino(v.destino_codigo || (typeof v.destino === 'string' ? v.destino : ''))
    setFormSalida(v.salida ? new Date(v.salida).toISOString().slice(0, 16) : '')
    setFormLlegada(v.llegada ? new Date(v.llegada).toISOString().slice(0, 16) : '')
    setFormPrecio(Number(v.precio))
    setFormMoneda(v.moneda)
    setFormCuposTotales(v.cupos_totales)
    setFormCuposDisponibles(v.cupos_disponibles)
    setFormRefExterna(v.referencia_externa || '')
    setErrorForm(null)
    setModalAbierto(true)
  }

  const guardarVuelo = async (e: FormEvent) => {
    e.preventDefault()
    if (!formProveedorId || !formNumero || !formOrigen || !formDestino || !formSalida || !formLlegada) {
      setErrorForm('Por favor completa todos los campos requeridos.')
      return
    }
    if (formOrigen === formDestino) {
      setErrorForm('El aeropuerto de destino no puede ser idéntico al de origen.')
      return
    }
    if (new Date(formLlegada) <= new Date(formSalida)) {
      setErrorForm('La hora de llegada debe ser posterior a la salida.')
      return
    }
    if (Number(formCuposDisponibles) > Number(formCuposTotales)) {
      setErrorForm('Los cupos disponibles no pueden superar los totales.')
      return
    }

    setOcupado(true)
    setErrorForm(null)
    try {
      const payload: CrearVueloPayload = {
        proveedor_id: Number(formProveedorId),
        numero_vuelo: formNumero.trim().toUpperCase(),
        origen_codigo: formOrigen,
        destino_codigo: formDestino,
        salida: new Date(formSalida).toISOString(),
        llegada: new Date(formLlegada).toISOString(),
        precio: Number(formPrecio),
        moneda: formMoneda,
        cupos_totales: Number(formCuposTotales),
        cupos_disponibles: Number(formCuposDisponibles),
        referencia_externa: formRefExterna.trim() || undefined,
      }

      if (editando) {
        await catalogoApi.actualizarVuelo(editando.id, payload)
        setAviso(`Vuelo ${payload.numero_vuelo} actualizado con éxito.`)
      } else {
        await catalogoApi.crearVuelo(payload)
        setAviso(`Vuelo ${payload.numero_vuelo} incorporado a la flota.`)
      }
      setModalAbierto(false)
      cargarDatos()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const eliminarVuelo = async (id: number, numero: string) => {
    if (!confirm(`¿Confirmas la eliminación del vuelo ${numero}?`)) return
    try {
      await catalogoApi.eliminarVuelo(id)
      setAviso(`Vuelo ${numero} eliminado.`)
      cargarDatos()
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  // Métricas
  const totalCupos = useMemo(
    () => vuelos.reduce((acc, v) => acc + (v.cupos_disponibles || 0), 0),
    [vuelos]
  )

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <header className="border-b border-[#231a13]/10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
              <IconoUbicacion className="h-4 w-4" />
              <span>CU4 · Gestión Operativa de Vuelos</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
              Inventario de Vuelos y Rutas Aéreas
            </h1>
            <p className="mt-1 text-sm text-[#231a13]/70">
              Control de trayectos, cupos asignados con aerolíneas aliadas y conexiones para paquetes turísticos.
            </p>
          </div>

          <Button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 rounded-full bg-[#792609] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#983d1f]"
          >
            <IconoMas className="h-4 w-4" />
            <span>Programar Vuelo</span>
          </Button>
        </div>

        {/* Tarjetas informativas de bitácora */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#231a13]/10 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-[#231a13]/60">Vuelos en Sistema</div>
            <div className="mt-1 font-serif text-2xl font-bold text-[#792609]">{vuelos.length}</div>
            <div className="text-xs text-[#231a13]/50">Rutas activas en calendario</div>
          </div>
          <div className="rounded-xl border border-[#231a13]/10 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-[#231a13]/60">Asientos Disponibles</div>
            <div className="mt-1 font-serif text-2xl font-bold text-[#141d16]">{totalCupos}</div>
            <div className="text-xs text-[#231a13]/50">Cupos totales listos para reserva</div>
          </div>
          <div className="rounded-xl border border-[#231a13]/10 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-[#231a13]/60">Aerolíneas Asociadas</div>
            <div className="mt-1 font-serif text-2xl font-bold text-[#583e00]">{aerolineas.length}</div>
            <div className="text-xs text-[#231a13]/50">Proveedores aéreos homologados</div>
          </div>
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

      {/* Filtros de búsqueda */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 sm:grid-cols-4">
        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Origen</label>
          <select
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los orígenes</option>
            {aeropuertos.map((a) => (
              <option key={a.codigo_iata} value={a.codigo_iata}>
                {a.codigo_iata} — {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Destino</label>
          <select
            value={filtroDestino}
            onChange={(e) => setFiltroDestino(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los destinos</option>
            {aeropuertos.map((a) => (
              <option key={a.codigo_iata} value={a.codigo_iata}>
                {a.codigo_iata} — {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Aerolínea</label>
          <select
            value={filtroAerolinea}
            onChange={(e) => setFiltroAerolinea(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#231a13]/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todas las aerolíneas</option>
            {aerolineas.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-[#231a13]/70">Búsqueda rápida</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Ej. OB-1420 o Cusco..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border border-[#231a13]/20 bg-white pl-8 pr-3 py-1.5 text-sm"
            />
            <IconoLupa className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#231a13]/40" />
          </div>
        </div>
      </div>

      {/* Tabla de vuelos */}
      <div className="overflow-hidden rounded-xl border border-[#231a13]/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#231a13]/10 text-left text-sm">
          <thead className="bg-[#faf5eb] font-serif text-xs uppercase tracking-wider text-[#231a13]/70">
            <tr>
              <th className="px-4 py-3">Vuelo</th>
              <th className="px-4 py-3">Aerolínea</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Horario Salida / Llegada</th>
              <th className="px-4 py-3">Cupos (Disp / Tot)</th>
              <th className="px-4 py-3">Tarifa</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#231a13]/10">
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#231a13]/50">
                  Cargando inventario de vuelos...
                </td>
              </tr>
            ) : vuelos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#231a13]/50">
                  No se registraron vuelos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              vuelos.map((v) => {
                const salidaFmt = new Date(v.salida).toLocaleString('es-BO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const llegadaFmt = new Date(v.llegada).toLocaleString('es-BO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const pct = v.cupos_totales > 0 ? (v.cupos_disponibles / v.cupos_totales) * 100 : 0

                return (
                  <tr key={v.id} className="hover:bg-[#faf5eb]/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#792609]">
                      {v.numero_vuelo}
                      {v.referencia_externa && (
                        <span className="block text-[11px] font-normal text-[#231a13]/50">
                          Ref: {v.referencia_externa}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#231a13]">
                      <div className="flex items-center gap-1.5">
                        <IconoMaletin className="h-3.5 w-3.5 text-[#231a13]/40" />
                        <span>{v.proveedor_nombre || `Proveedor #${v.proveedor}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#141d16]">
                        {v.origen_codigo || v.origen} → {v.destino_codigo || v.destino}
                      </div>
                      <div className="text-[11px] text-[#231a13]/60 truncate max-w-[200px]">
                        {v.origen_nombre} a {v.destino_nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#231a13]/80">
                      <div>Salida: {salidaFmt}</div>
                      <div>Llegada: {llegadaFmt}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#231a13]">
                          {v.cupos_disponibles} / {v.cupos_totales}
                        </span>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            pct > 30 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#792609]">
                      {v.moneda} {Number(v.precio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirModalEditar(v)}
                          title="Editar vuelo"
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-[#231a13]/5 hover:text-[#792609]"
                        >
                          <IconoLapiz className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarVuelo(v.id, v.numero_vuelo)}
                          title="Eliminar vuelo"
                          className="rounded-lg p-1.5 text-[#231a13]/70 hover:bg-rose-50 hover:text-rose-600"
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

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo={editando ? `Editar Vuelo ${editando.numero_vuelo}` : 'Programar Nuevo Vuelo'}
        >
          <form onSubmit={guardarVuelo} className="space-y-4">
            {errorForm && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorForm}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Aerolínea aliada *</label>
                <select
                  required
                  value={formProveedorId}
                  onChange={(e) => setFormProveedorId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona aerolínea...</option>
                  {aerolineas.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Número de Vuelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. OB-1420"
                  value={formNumero}
                  onChange={(e) => setFormNumero(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Aeropuerto Origen *</label>
                <select
                  required
                  value={formOrigen}
                  onChange={(e) => setFormOrigen(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona origen...</option>
                  {aeropuertos.map((a) => (
                    <option key={a.codigo_iata} value={a.codigo_iata}>
                      {a.codigo_iata} — {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Aeropuerto Destino *</label>
                <select
                  required
                  value={formDestino}
                  onChange={(e) => setFormDestino(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona destino...</option>
                  {aeropuertos.map((a) => (
                    <option key={a.codigo_iata} value={a.codigo_iata}>
                      {a.codigo_iata} — {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Salida (Fecha y Hora) *</label>
                <input
                  type="datetime-local"
                  required
                  value={formSalida}
                  onChange={(e) => setFormSalida(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Llegada (Fecha y Hora) *</label>
                <input
                  type="datetime-local"
                  required
                  value={formLlegada}
                  onChange={(e) => setFormLlegada(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Tarifa *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formPrecio}
                  onChange={(e) => setFormPrecio(e.target.value === '' ? '' : Number(e.target.value))}
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Ref. Externa / GDS</label>
                <input
                  type="text"
                  placeholder="Localizador o ID Amadeus"
                  value={formRefExterna}
                  onChange={(e) => setFormRefExterna(e.target.value)}
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
                {ocupado ? 'Guardando...' : editando ? 'Actualizar Vuelo' : 'Registrar Vuelo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
