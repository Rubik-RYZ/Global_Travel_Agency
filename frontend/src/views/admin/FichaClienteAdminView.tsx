import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { clientesApi } from '@/api/clientes'
import { RosaVientos } from '@/components/brand/RosaVientos'
import { Monograma } from '@/components/shared/Monograma'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoBasura,
  IconoEtiqueta,
  IconoFlechaIzquierda,
  IconoLapiz,
  IconoMoneda,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import type { Cliente } from '@/types/clientes.types'
import { textoDocumento, textoInteres } from '@/utils/catalogos'
import { formatearFecha, formatearMoneda } from '@/utils/formatters'
import { esAdmin } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'
import { ClienteFormModal } from '@/views/admin/components/ClienteFormModal'

/** 13. Panel · Ficha del viajero → /admin/clientes/:id */
export function FichaClienteAdminView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const puedeEditar = esAdmin(usuario?.rol)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      setCliente(await clientesApi.obtener(Number(id)))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const eliminar = async () => {
    if (!cliente) return
    if (!window.confirm(`¿Eliminar definitivamente a ${cliente.nombre_completo}?`)) return
    try {
      await clientesApi.eliminar(cliente.id)
      navigate('/admin/clientes', { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* --- Migas de pan --- */}
      <nav className="mb-6 flex items-center gap-2">
        <Link
          to="/admin/clientes"
          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
        >
          <IconoFlechaIzquierda className="h-3.5 w-3.5" />
          Directorio de viajeros
        </Link>
        {cliente && (
          <>
            <span aria-hidden className="text-outline-variant">
              /
            </span>
            <span className="coord text-primary">{cliente.nombre_completo}</span>
          </>
        )}
      </nav>

      {error && (
        <p className="mb-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {cargando || !cliente ? (
        !error && <p className="nota-manuscrita text-stamp-sepia">Buscando la ficha...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <TarjetaCabecera
            cliente={cliente}
            puedeEditar={puedeEditar}
            onEditar={() => setModalAbierto(true)}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <section className="rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper sm:p-8 lg:col-span-7">
              <div className="flex items-center gap-2">
                <IconoEtiqueta className="h-4 w-4 text-terracotta" />
                <p className="etiqueta-seccion text-primary">Ficha del viajero</p>
              </div>
              <h2 className="mt-2 font-display text-2xl text-on-surface">Datos personales</h2>

              <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Dato etiqueta="Documento" valor={cliente.documento_numero ?? 'Sin registrar'} />
                <Dato etiqueta="Tipo de documento" valor={textoDocumento(cliente.documento_tipo)} />
                <Dato etiqueta="Teléfono" valor={cliente.telefono ?? 'Sin registrar'} />
                <Dato etiqueta="País de origen" valor={cliente.pais_origen ?? 'Sin registrar'} />
                <Dato
                  etiqueta="Fecha de nacimiento"
                  valor={
                    cliente.fecha_nacimiento
                      ? formatearFecha(cliente.fecha_nacimiento)
                      : 'Sin registrar'
                  }
                />
                <Dato etiqueta="Alta en el sistema" valor={formatearFecha(cliente.creado_en)} />
                <Dato
                  etiqueta="Cuenta de acceso"
                  valor={cliente.usuario_email ?? 'Alta presencial · sin cuenta'}
                />
              </dl>
            </section>

            <section className="flex flex-col rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper sm:p-8 lg:col-span-5">
              <div className="flex items-center gap-2">
                <IconoEtiqueta className="h-4 w-4 text-terracotta" />
                <p className="etiqueta-seccion text-primary">Preferencias de viaje</p>
              </div>
              <h2 className="mt-2 font-display text-2xl text-on-surface">Cuaderno de ruta</h2>

              {cliente.preferencias ? (
                <>
                  <div className="mt-6 flex items-end justify-between gap-4 border-b border-parchment-border/70 pb-4">
                    <div>
                      <p className="coord">Presupuesto máximo</p>
                      <p className="mt-1 font-display text-2xl text-on-surface">
                        {cliente.preferencias.presupuesto_max
                          ? formatearMoneda(
                              cliente.preferencias.presupuesto_max,
                              cliente.preferencias.moneda,
                            )
                          : 'A convenir'}
                      </p>
                    </div>
                    <IconoMoneda className="h-8 w-8 text-terracotta/40" aria-hidden />
                  </div>

                  <div className="mt-5">
                    <p className="coord">Intereses</p>
                    {cliente.preferencias.intereses.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {cliente.preferencias.intereses.map((i) => (
                          <li
                            key={i}
                            className="rounded-full border border-terracotta/30 bg-terracotta/10 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary"
                          >
                            {textoInteres(i)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 font-sans text-sm text-on-surface-variant">
                        El viajero aún no marcó intereses.
                      </p>
                    )}
                  </div>

                  <p className="mt-auto pt-6 font-hand text-base text-stamp-sepia">
                    Actualizada el {formatearFecha(cliente.preferencias.actualizado_en)}
                  </p>
                </>
              ) : (
                <p className="mt-6 font-hand text-lg text-stamp-sepia">
                  Este viajero todavía no registró sus preferencias.
                </p>
              )}
            </section>
          </div>

          {puedeEditar && (
            <section className="rounded-lg border border-error/25 bg-error-container/20 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-on-error-container">
                    Zona sensible
                  </p>
                  <p className="mt-1 font-sans text-sm text-on-surface-variant">
                    Eliminar la ficha del viajero. Se bloquea si tiene reservas asociadas.
                  </p>
                </div>
                <Button
                  variante="ghost"
                  onClick={eliminar}
                  className="border-error/40 text-error hover:bg-error-container/40"
                >
                  <IconoBasura className="h-4 w-4" />
                  Eliminar viajero
                </Button>
              </div>
            </section>
          )}
        </div>
      )}

      <ClienteFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        cliente={cliente}
        onGuardado={cargar}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function TarjetaCabecera({
  cliente,
  puedeEditar,
  onEditar,
}: {
  cliente: Cliente
  puedeEditar: boolean
  onEditar: () => void
}) {
  const expediente = String(cliente.id).padStart(5, '0')

  return (
    <section className="relative overflow-hidden rounded-lg border border-secondary/30 bg-secondary text-on-secondary shadow-paper-lg">
      <div
        aria-hidden
        className="textura-carta pointer-events-none absolute inset-0 opacity-[0.05]"
      />
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.08]">
        <RosaVientos className="h-60 w-60 text-gold" />
      </div>

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-white/10 px-6 py-3 sm:px-8">
        <span className="coord text-gold">Ficha biográfica de campo</span>
        <span className="coord text-on-secondary-container">Expediente N.o {expediente}</span>
        <span className="coord ml-auto text-on-secondary-container">La Paz · Bolivia</span>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <Monograma
            nombre={cliente.nombre_completo}
            tamano="lg"
            className="border-gold/40 bg-gold/10 text-gold"
          />
          <div>
            <p className="coord text-gold">Viajero registrado</p>
            <h1 className="mt-1.5 font-display text-3xl leading-tight text-on-secondary sm:text-4xl">
              {cliente.nombre_completo}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color="dorado">{textoDocumento(cliente.documento_tipo)}</Badge>
              {cliente.pais_origen && <Badge color="dorado">{cliente.pais_origen}</Badge>}
              <Badge color={cliente.usuario_email ? 'bosque' : 'neutro'}>
                {cliente.usuario_email ? 'Con cuenta' : 'Presencial'}
              </Badge>
            </div>
          </div>
        </div>

        {puedeEditar && (
          <Button onClick={onEditar}>
            <IconoLapiz className="h-4 w-4" />
            Editar ficha
          </Button>
        )}
      </div>
    </section>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="coord">{etiqueta}</dt>
      <dd className="mt-1 truncate font-sans text-sm text-on-surface">{valor}</dd>
    </div>
  )
}
