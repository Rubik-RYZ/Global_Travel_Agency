import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { clientesApi } from '@/api/clientes'
import { catalogoApi } from '@/api/catalogo'
import { reservasApi } from '@/api/reservas'
import type { Paquete, PaqueteSalida } from '@/types/catalogo.types'
import type { Cliente } from '@/types/clientes.types'
import type { Pasajero } from '@/types/reserva.types'
import { Button } from '@/components/ui/Button/Button'
import { IconoPortapapeles } from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

export function NuevaReservaAdminView() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [salidas, setSalidas] = useState<PaqueteSalida[]>([])

  const [clienteId, setClienteId] = useState<number | ''>('')
  const [paqueteId, setPaqueteId] = useState<number | ''>('')
  const [salidaId, setSalidaId] = useState<number | ''>('')
  const [numPersonas, setNumPersonas] = useState(1)

  const [pasajeros, setPasajeros] = useState<Pasajero[]>([
    { nombres: '', apellidos: '', documento_tipo: 'CI', documento_numero: '', fecha_nacimiento: '' },
  ])

  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const salidaSeleccionada = salidas.find((s) => s.id === Number(salidaId))
  const paqueteSeleccionado = paquetes.find((p) => p.id === Number(paqueteId))
  const precioUnitario = paqueteSeleccionado ? Number(paqueteSeleccionado.precio_base) : 0
  const total = precioUnitario * numPersonas

  const registrarReserva = async (e: FormEvent) => {
    e.preventDefault()
    if (!clienteId || !salidaId) {
      setError('Por favor selecciona cliente y salida programada.')
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
        cliente_id: Number(clienteId),
        salida_id: Number(salidaId),
        num_personas: numPersonas,
        canal: 'personal' as const,
        pasajeros: pasajeros.map((p) => ({
          nombres: p.nombres.trim(),
          apellidos: p.apellidos.trim(),
          documento_tipo: p.documento_tipo || undefined,
          documento_numero: p.documento_numero?.trim() || undefined,
          fecha_nacimiento: p.fecha_nacimiento || undefined,
        })),
      }

      const res = await reservasApi.crearReserva(payload)
      navigate(`/admin/reservas/${res.id}`)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado(false)
    }
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
          Emitir Nueva Reserva
        </h1>
        <p className="mt-1 text-sm text-[#231a13]/70">
          Alta directa de expediente de viaje para viajeros atendidos en oficina.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={registrarReserva} className="space-y-8">
        <div className="rounded-2xl border border-[#231a13]/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#231a13]">1. Selección de Cliente y Expedición</h2>

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

          <div className="rounded-xl border border-[#231a13]/10 bg-[#faf5eb] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase text-[#231a13]/60">Total a liquidar:</span>
              <div className="font-serif text-2xl font-bold text-[#792609]">
                {paqueteSeleccionado?.moneda || 'USD'} {total.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-[#231a13]/60">
              Canal asignado: Mostrador / Personal
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
              {ocupado ? 'Registrando...' : 'Emitir Reserva'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

