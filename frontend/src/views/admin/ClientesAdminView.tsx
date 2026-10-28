import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { clientesApi } from '@/api/clientes'
import { Monograma } from '@/components/shared/Monograma'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { IconoFlechaDerecha, IconoLupa, IconoMas } from '@/components/ui/Iconos'
import { Input } from '@/components/ui/Input/Input'
import { useAuthStore } from '@/store/authStore'
import type { Cliente } from '@/types/clientes.types'
import { DOCUMENTOS, textoDocumento, textoInteres } from '@/utils/catalogos'
import { formatearFecha, formatearMoneda } from '@/utils/formatters'
import { esAdmin } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'
import { ClienteFormModal } from '@/views/admin/components/ClienteFormModal'

const FILTROS_DOCUMENTO = [{ valor: '', texto: 'Todos' }, ...DOCUMENTOS]

function expediente(id: number): string {
  return String(id).padStart(5, '0')
}

/** 12. Panel · Directorio de viajeros → /admin/clientes */
export function ClientesAdminView() {
  const usuario = useAuthStore((s) => s.usuario)
  const puedeEditar = esAdmin(usuario?.rol)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [haySiguiente, setHaySiguiente] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [documento, setDocumento] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await clientesApi.listar({
        page: pagina,
        search: busqueda || undefined,
        documento_tipo: documento || undefined,
      })
      setClientes(data.results)
      setTotal(data.count)
      setHaySiguiente(Boolean(data.next))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [pagina, busqueda, documento])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const conPreferencias = clientes.filter((c) => c.preferencias).length

  return (
    <div className="mx-auto max-w-6xl">
      {/* --- Cabecera --- */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="regla-terracota" />
            <p className="etiqueta-seccion">Panel · Viajeros</p>
          </div>
          <h1 className="mt-3 font-display text-4xl text-on-surface">Directorio de viajeros</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-on-surface-variant">
            Padrón de clientes: datos de contacto, documentación y preferencias de viaje.
          </p>
        </div>
        {puedeEditar && (
          <Button onClick={() => setModalAbierto(true)}>
            <IconoMas className="h-4 w-4" />
            Registrar viajero
          </Button>
        )}
      </header>

      {/* --- Cifras del padrón --- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Cifra etiqueta="En el padrón" valor={String(total)} nota="viajeros registrados" />
        <Cifra
          etiqueta="Con preferencias"
          valor={String(conPreferencias)}
          nota="en esta página"
        />
        <Cifra etiqueta="Página" valor={String(pagina)} nota="del directorio" />
      </div>

      {/* --- Herramientas de búsqueda --- */}
      <section className="mb-6 overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
        <div className="grid gap-4 border-b border-parchment-border/70 bg-surface-container-low px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input
            label="Buscar viajero"
            placeholder="Nombre, apellido o documento…"
            icono={<IconoLupa className="h-4 w-4" />}
            value={busqueda}
            onChange={(e) => {
              setPagina(1)
              setBusqueda(e.target.value)
            }}
          />
          <p className="coord sm:pb-2.5">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          <span className="coord mr-1">Documento</span>
          {FILTROS_DOCUMENTO.map((f) => {
            const activo = documento === f.valor
            return (
              <button
                key={f.valor || 'todos'}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  setPagina(1)
                  setDocumento(f.valor)
                }}
                className={`rounded-full border px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-wider transition-all ${
                  activo
                    ? 'border-terracotta bg-terracotta text-white shadow-paper'
                    : 'border-parchment-border bg-surface-container-low text-on-surface-variant hover:-translate-y-0.5 hover:border-terracotta/50 hover:text-primary'
                }`}
              >
                {f.texto}
              </button>
            )
          })}
        </div>
      </section>

      {error && (
        <p className="mb-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {/* --- Dossiers --- */}
      {cargando ? (
        <p className="nota-manuscrita text-stamp-sepia">Abriendo el padrón de viajeros...</p>
      ) : clientes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
          <p className="font-display text-xl text-on-surface">Sin viajeros que mostrar</p>
          <p className="mt-2 font-sans text-sm text-on-surface-variant">
            Ajuste la búsqueda o registre un nuevo viajero para comenzar el padrón.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clientes.map((c) => (
            <Dossier key={c.id} cliente={c} />
          ))}
        </ul>
      )}

      {/* --- Paginación --- */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variante="ghost"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
        >
          ← Anterior
        </Button>
        <span className="coord">Página {pagina}</span>
        <Button
          variante="ghost"
          tamano="sm"
          disabled={!haySiguiente}
          onClick={() => setPagina((p) => p + 1)}
        >
          Siguiente →
        </Button>
      </div>

      <ClienteFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        cliente={null}
        onGuardado={cargar}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Cifra({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: string }) {
  return (
    <div className="rounded-lg border border-parchment-border bg-surface-container-lowest px-5 py-4 shadow-paper">
      <p className="coord">{etiqueta}</p>
      <p className="mt-1 font-display text-3xl leading-none text-primary">{valor}</p>
      <p className="mt-1.5 font-sans text-xs text-on-surface-variant">{nota}</p>
    </div>
  )
}

function DatoMini({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="coord">{etiqueta}</dt>
      <dd className="mt-0.5 truncate font-sans text-sm text-on-surface">{valor}</dd>
    </div>
  )
}

function Dossier({ cliente }: { cliente: Cliente }) {
  const intereses = cliente.preferencias?.intereses ?? []

  return (
    <li className="group flex flex-col overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper transition-shadow hover:shadow-paper-lg">
      <div className="flex items-center justify-between gap-3 border-b border-parchment-border/70 bg-surface-container-low px-5 py-2.5">
        <span className="coord">Expediente N.o {expediente(cliente.id)}</span>
        <Badge color={cliente.usuario_email ? 'bosque' : 'neutro'}>
          {cliente.usuario_email ? 'Con cuenta' : 'Presencial'}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <Monograma nombre={cliente.nombre_completo} tamano="md" />
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight text-on-surface">
              {cliente.nombre_completo}
            </h3>
            <p className="mt-0.5 truncate font-sans text-xs text-on-surface-variant">
              {cliente.usuario_email ?? 'Alta presencial · sin cuenta'}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-parchment-border/70 py-4">
          <DatoMini etiqueta="Documento" valor={cliente.documento_numero ?? 'Sin registrar'} />
          <DatoMini etiqueta="Tipo" valor={textoDocumento(cliente.documento_tipo)} />
          <DatoMini etiqueta="Teléfono" valor={cliente.telefono ?? 'Sin teléfono'} />
          <DatoMini etiqueta="Origen" valor={cliente.pais_origen ?? 'Sin registrar'} />
        </dl>

        <div className="mt-auto">
          <p className="coord">Preferencias</p>
          {intereses.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {intereses.slice(0, 3).map((i) => (
                <li
                  key={i}
                  className="rounded-full border border-terracotta/30 bg-terracotta/10 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-primary"
                >
                  {textoInteres(i)}
                </li>
              ))}
              {intereses.length > 3 && (
                <li className="rounded-full border border-parchment-border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  +{intereses.length - 3}
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-1.5 font-sans text-xs text-on-surface-variant">
              Aún sin registrar preferencias.
            </p>
          )}

          {cliente.preferencias?.presupuesto_max && (
            <p className="mt-3 font-hand text-base text-stamp-sepia">
              Techo de viaje:{' '}
              {formatearMoneda(
                cliente.preferencias.presupuesto_max,
                cliente.preferencias.moneda,
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-parchment-border/70 px-5 py-3">
        <span className="coord">Alta · {formatearFecha(cliente.creado_en)}</span>
        <Link
          to={`/admin/clientes/${cliente.id}`}
          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:text-terracotta"
        >
          Ver ficha
          <IconoFlechaDerecha className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </li>
  )
}
