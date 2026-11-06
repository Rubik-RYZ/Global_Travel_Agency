import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { clientesApi } from '@/api/clientes'
import { catalogoApi } from '@/api/catalogo'
import { descargarBlob, pagosApi } from '@/api/pagos'
import type { Paquete, PaqueteSalida } from '@/types/catalogo.types'
import type { Cliente } from '@/types/clientes.types'
import type { ClienteNuevoPayload, MetodoVentanilla, VentaResultado } from '@/types/pago.types'
import type { Pasajero } from '@/types/reserva.types'
import { Button } from '@/components/ui/Button/Button'
import { IconoDescarga, IconoPortapapeles } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal/Modal'
import { mensajeDeError } from '@/utils/validators'

const METODOS: { valor: MetodoVentanilla; etiqueta: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo (ventanilla)' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'qr', etiqueta: 'QR' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
]

const CLIENTE_VACIO: ClienteNuevoPayload = {
  nombres: '',
  apellidos: '',
  documento_tipo: 'CI',
  documento_numero: '',
  telefono: '',
  fecha_nacimiento: '',
}

export function NuevaReservaAdminView() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])

  const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo'>('existente')
  const [clienteId, setClienteId] = useState<number | ''>('')
  const [clienteNuevo, setClienteNuevo] = useState<ClienteNuevoPayload>(CLIENTE_VACIO)

  const [paqueteId, setPaqueteId] = useState<number | ''>('')
  const [salidaId, setSalidaId] = useState<number | ''>('')
  const [numPersonas, setNumPersonas] = useState(1)
  const [metodoPago, setMetodoPago] = useState<MetodoVentanilla>('efectivo')

  const [pasajeros, setPasajeros] = useState<Pasajero[]>([
    { nombres: '', apellidos: '', documento_tipo: 'CI', documento_numero: '', fecha_nacimiento: '' },
  ])

  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [venta, setVenta] = useState<VentaResultado | null>(null)
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      try {
        const [resCli, resPaq] = await Promise.all([
          clientesApi.listar(),
          catalogoApi.listarPaquetes({ solo_activos: true }),
        ])
        setClientes(resCli.results || [])
        setPaquetes(resPaq.results || [])
        if (resCli.results && resCli.results.length > 0) setClienteId(resCli.results[0].id)
        if (resPaq.results && resPaq.results.length > 0) setPaqueteId(resPaq.results[0].id)
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  useEffect(() => {
    if (!paqueteId) return
    const cargarSalidas = async () => {
      try {
        const res = await catalogoApi.listarSalidas({ paquete_id: Number(paqueteId), solo_con_cupo: true })
        setSalidas(res.results || [])
        if (res.results && res.results.length > 0) {
          setSalidaId(res.results[0].id)
        } else {
          setSalidaId('')
        }
      } catch (err) {
        setError(mensajeDeError(err))
      }
    }
    cargarSalidas()
  }, [paqueteId])

  const cambiarNumPersonas = (cantidad: number) => {
    setNumPersonas(cantidad)
    setPasajeros((prev) => {
      const arr = [...prev]
      if (cantidad > arr.length) {
        for (let i = arr.length; i < cantidad; i++) {
          arr.push({ nombres: '', apellidos: '', documento_tipo: 'CI', documento_numero: '', fecha_nacimiento: '' })
        }
      } else {
        return arr.slice(0, cantidad)
      }
      return arr
    })
  }

  const actualizarPasajero = (idx: number, campo: keyof Pasajero, val: string) => {
    setPasajeros((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [campo]: val }
      return copy
    })
  }

  const actualizarClienteNuevo = (campo: keyof ClienteNuevoPayload, val: string) => {
    setClienteNuevo((prev) => ({ ...prev, [campo]: val }))
  }

  const salidaSeleccionada = salidas.find((s) => s.id === Number(salidaId))
  const paqueteSeleccionado = paquetes.find((p) => p.id === Number(paqueteId))
  const precioUnitario = paqueteSeleccionado ? Number(paqueteSeleccionado.precio_base) : 0
  const total = precioUnitario * numPersonas

  const registrarReserva = async (e: FormEvent) => {
    e.preventDefault()
    if (!salidaId) {
      setError('Por favor selecciona la salida programada.')
      return
    }
    if (modoCliente === 'existente' && !clienteId) {
      setError('Por favor selecciona el cliente titular.')
      return
    }
    if (modoCliente === 'nuevo' && (!clienteNuevo.nombres.trim() || !clienteNuevo.apellidos.trim())) {
      setError('Ingresa nombres y apellidos del cliente nuevo.')
      return
    }

    for (let i = 0; i < pasajeros.length; i++) {
      if (!pasajeros[i].nombres.trim() || !pasajeros[i].apellidos.trim()) {
        setError(`Faltan nombres o apellidos para el pasajero ${i + 1}.`)
        return
      }
    }

    setOcupado(true)
    setError(null)
    try {
      const payload = {
        salida_id: Number(salidaId),
        num_personas: numPersonas,
        metodo: metodoPago,
        pasajeros: pasajeros.map((p) => ({
          nombres: p.nombres.trim(),
          apellidos: p.apellidos.trim(),
          documento_tipo: p.documento_tipo || undefined,
          documento_numero: p.documento_numero?.trim() || undefined,
          fecha_nacimiento: p.fecha_nacimiento || undefined,
        })),
      }

      const clienteNuevoLimpio: ClienteNuevoPayload = {
        nombres: clienteNuevo.nombres.trim(),
        apellidos: clienteNuevo.apellidos.trim(),
        documento_tipo: clienteNuevo.documento_tipo || undefined,
        documento_numero: clienteNuevo.documento_numero?.trim() || undefined,
        telefono: clienteNuevo.telefono?.trim() || undefined,
        fecha_nacimiento: clienteNuevo.fecha_nacimiento || undefined,
      }

      const res = await pagosApi.ventaVentanilla(
        modoCliente === 'nuevo'
          ? { ...payload, cliente_nuevo: clienteNuevoLimpio }
          : { ...payload, cliente_id: Number(clienteId) },
      )
      setVenta(res)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const descargarBoleta = async () => {
    if (!venta) return
    setDescargando(true)
    setErrorDescarga(null)
    try {
      const blob = await pagosApi.descargarBoleta(venta.reserva.id)
      descargarBlob(blob, `boleta-${venta.reserva.codigo}.pdf`)
      navigate(`/admin/reservas/${venta.reserva.id}`)
    } catch (err) {
      setErrorDescarga(mensajeDeError(err))
    } finally {
      setDescargando(false)
    }
  }

  const cerrarModal = () => {
    const reservaId = venta?.reserva.id
    setVenta(null)
    setErrorDescarga(null)
    if (reservaId) navigate(`/admin/reservas/${reservaId}`)
  }

  if (cargando) {
    return <div className="py-16 text-center text-[#231a13]/50">Cargando padrón de clientes y paquetes...</div>
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[#231a13]/10 pb-6">
        <Link to="/admin/reservas" className="text-xs uppercase font-semibold text-[#792609] hover:underline block mb-2">
          ← Volver a la mesa de reservas
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#792609]">
          <IconoPortapapeles className="h-4 w-4" />
          <span>Atención Presencial de Mostrador</span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#231a13]">
          Emitir Boleto en Ventanilla
        </h1>
        <p className="mt-1 text-sm text-[#231a13]/70">
          Registra al viajero, cobra en ventanilla y emite la boleta de viaje descargable.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={registrarReserva} className="space-y-8">
        <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#231a13]">1. Cliente y Expedición</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModoCliente('existente')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                modoCliente === 'existente' ? 'bg-[#792609] text-white' : 'border border-[#231a13]/20 text-[#231a13]'
              }`}
            >
              Cliente registrado
            </button>
            <button
              type="button"
              onClick={() => setModoCliente('nuevo')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                modoCliente === 'nuevo' ? 'bg-[#792609] text-white' : 'border border-[#231a13]/20 text-[#231a13]'
              }`}
            >
              Registrar cliente nuevo
            </button>
          </div>

          {modoCliente === 'existente' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Cliente Titular *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo} (Doc: {c.documento_numero || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Paquete Turístico *</label>
                <select
                  required
                  value={paqueteId}
                  onChange={(e) => setPaqueteId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona paquete...</option>
                  {paquetes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.duracion_dias} días)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-[#231a13]/80">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={clienteNuevo.nombres}
                    onChange={(e) => actualizarClienteNuevo('nombres', e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-[#231a13]/80">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={clienteNuevo.apellidos}
                    onChange={(e) => actualizarClienteNuevo('apellidos', e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-[#231a13]/80">Tipo Doc.</label>
                  <select
                    value={clienteNuevo.documento_tipo || 'CI'}
                    onChange={(e) => actualizarClienteNuevo('documento_tipo', e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                  >
                    <option value="CI">CI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-[#231a13]/80">Número Doc.</label>
                  <input
                    type="text"
                    value={clienteNuevo.documento_numero || ''}
                    onChange={(e) => actualizarClienteNuevo('documento_numero', e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-[#231a13]/80">Teléfono</label>
                  <input
                    type="text"
                    value={clienteNuevo.telefono || ''}
                    onChange={(e) => actualizarClienteNuevo('telefono', e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[#231a13]/80">Paquete Turístico *</label>
                <select
                  required
                  value={paqueteId}
                  onChange={(e) => setPaqueteId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
                >
                  <option value="">Selecciona paquete...</option>
                  {paquetes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.duracion_dias} días)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Salida Programada *</label>
              <select
                required
                value={salidaId}
                onChange={(e) => setSalidaId(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              >
                <option value="">Selecciona fecha de partida...</option>
                {salidas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fecha_salida} — {s.cupos_disponibles} cupos libres
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Cantidad de Viajeros *</label>
              <input
                type="number"
                min="1"
                max={salidaSeleccionada?.cupos_disponibles || 10}
                value={numPersonas}
                onChange={(e) => cambiarNumPersonas(Math.max(1, Number(e.target.value)))}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Manifiesto de pasajeros */}
        <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#231a13]">
            2. Manifiesto de Pasajeros ({pasajeros.length})
          </h2>

          <div className="space-y-4">
            {pasajeros.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb]/30 p-4 space-y-3">
                <div className="font-bold text-xs uppercase text-[#792609]">
                  Pasajero {idx + 1}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs text-[#231a13]/70">Nombres *</label>
                    <input
                      type="text"
                      required
                      value={p.nombres}
                      onChange={(e) => actualizarPasajero(idx, 'nombres', e.target.value)}
                      className="mt-1 w-full rounded border border-[#231a13]/20 bg-white p-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#231a13]/70">Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={p.apellidos}
                      onChange={(e) => actualizarPasajero(idx, 'apellidos', e.target.value)}
                      className="mt-1 w-full rounded border border-[#231a13]/20 bg-white p-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#231a13]/70">Tipo Doc.</label>
                    <select
                      value={p.documento_tipo || 'CI'}
                      onChange={(e) => actualizarPasajero(idx, 'documento_tipo', e.target.value)}
                      className="mt-1 w-full rounded border border-[#231a13]/20 bg-white p-1.5 text-sm"
                    >
                      <option value="CI">CI</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#231a13]/70">Número Doc.</label>
                    <input
                      type="text"
                      value={p.documento_numero || ''}
                      onChange={(e) => actualizarPasajero(idx, 'documento_numero', e.target.value)}
                      className="mt-1 w-full rounded border border-[#231a13]/20 bg-white p-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cobro */}
        <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#231a13]">3. Cobro en Ventanilla</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#231a13]/80">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoVentanilla)}
                className="mt-1 w-full rounded-md border border-[#231a13]/20 p-2 text-sm"
              >
                {METODOS.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase text-[#231a13]/60">Total a cobrar:</span>
                <div className="font-serif text-2xl font-bold text-[#792609]">
                  {paqueteSeleccionado?.moneda || 'USD'} {total.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-[#231a13]/60">
                Canal: Mostrador / Personal
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#231a13]/10">
            <Link
              to="/admin/reservas"
              className="inline-flex items-center rounded-full border border-[#231a13]/20 px-5 py-2 text-xs font-semibold text-[#231a13]"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              disabled={ocupado}
              className="bg-[#792609] text-white hover:bg-[#983d1f]"
            >
              {ocupado ? 'Procesando cobro...' : 'Cobrar y emitir boleto'}
            </Button>
          </div>
        </div>
      </form>

      <Modal abierto={!!venta} onCerrar={cerrarModal} titulo="Venta registrada" ancho="sm">
        <div className="space-y-5">
          <p className="text-sm text-[#231a13]/80">
            El pago de la reserva{' '}
            <strong className="text-[#792609]">{venta?.reserva.codigo}</strong> se registró correctamente.
            ¿Desea descargar el boleto de viaje?
          </p>

          {errorDescarga && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorDescarga}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variante="ghost" onClick={cerrarModal} disabled={descargando}>
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
