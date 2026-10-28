import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { catalogoApi, type Proveedor } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import { Button } from '@/components/ui/Button/Button'
import { Modal } from '@/components/ui/Modal/Modal'
import { SubidorImagen } from '@/components/ui/SubidorImagen/SubidorImagen'
import {
  IconoBuzon,
  IconoCerrar,
  IconoDescarga,
  IconoEdificio,
  IconoFlechaDerecha,
  IconoGlobo,
  IconoLapiz,
  IconoLupa,
  IconoMaletin,
  IconoMas,
  IconoPausa,
  IconoPersona,
  IconoPlay,
  IconoSello,
  IconoSobre,
  IconoTelefono,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { mensajeDeError } from '@/utils/validators'

/** Tipos de prestación homologados (espejo de `TIPOS_PROVEEDOR`). */
const TIPOS = [
  { valor: 'aerolinea', texto: 'Aerolíneas' },
  { valor: 'hotel', texto: 'Hospedajes' },
  { valor: 'transporte', texto: 'Transporte' },
  { valor: 'operador', texto: 'Operadores' },
  { valor: 'otro', texto: 'Otros' },
]

function clave(id: number): string {
  return `PROV-${String(id).padStart(3, '0')}`
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function ubicacion(p: Proveedor): string {
  return [p.ciudad, p.pais].filter(Boolean).join(', ') || 'Sin enclave registrado'
}

/**
 * 20. Panel · Libreta de Proveedores → /admin/proveedores
 *
 * Directorio de la red de confianza: aerolíneas, hospedajes, transporte y
 * operadores con su ficha operativa real (enclave, enlace, canales y notas).
 * La lámina superior se abre en formato de folio y la estantería inferior
 * permite cambiar de prestador sin salir del archivo.
 */
export function ProveedoresAdminView() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [tipo, setTipo] = useState('')
  const [pais, setPais] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const acc: Proveedor[] = []
      let pagina = 1
      for (;;) {
        const data = await catalogoApi.listarProveedores({ page: pagina })
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setProveedores(acc)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const conteoTipos = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of proveedores) mapa.set(p.tipo, (mapa.get(p.tipo) ?? 0) + 1)
    return mapa
  }, [proveedores])

  const paises = useMemo(
    () =>
      Array.from(
        new Set(proveedores.map((p) => p.pais).filter((p): p is string => Boolean(p))),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [proveedores],
  )

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return proveedores.filter((p) => {
      if (tipo && p.tipo !== tipo) return false
      if (pais && p.pais !== pais) return false
      if (q) {
        const pajar = `${p.nombre} ${p.ciudad ?? ''} ${p.contacto ?? ''} ${p.email ?? ''}`
        if (!pajar.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [proveedores, tipo, pais, busqueda])

  const seleccionado = useMemo(
    () => filtrados.find((p) => p.id === seleccionadoId) ?? filtrados[0] ?? null,
    [filtrados, seleccionadoId],
  )

  const otros = useMemo(
    () => filtrados.filter((p) => p.id !== seleccionado?.id),
    [filtrados, seleccionado],
  )

  const metricas = useMemo(() => {
    const activos = proveedores.filter((p) => p.activo).length
    const cobertura = new Set(proveedores.map((p) => p.pais).filter(Boolean)).size
    return { total: proveedores.length, activos, cobertura }
  }, [proveedores])

  function seleccionar(id: number) {
    setSeleccionadoId(id)
    document.getElementById('folio-proveedor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(p: Proveedor) {
    setEditando(p)
    setModalAbierto(true)
  }

  async function alternarActivo(p: Proveedor) {
    setOcupado(true)
    setError(null)
    try {
      await catalogoApi.toggleActivoProveedor(p.id)
      setAviso(p.activo ? 'Prestador retirado de la red activa.' : 'Prestador reactivado en la red.')
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setOcupado(false)
    }
  }

  /** Descarga el dossier filtrado como CSV (abre bien en Excel en español). */
  function exportar() {
    if (filtrados.length === 0) return
    const filas = [
      ['Clave', 'Nombre', 'Tipo', 'País', 'Ciudad', 'Contacto', 'Email', 'Teléfono', 'Estado', 'Notas'],
      ...filtrados.map((p) => [
        clave(p.id),
        p.nombre,
        p.tipo_display,
        p.pais ?? '',
        p.ciudad ?? '',
        p.contacto ?? '',
        p.email ?? '',
        p.telefono ?? '',
        p.activo ? 'Activo' : 'Fuera de la red',
        p.notas ?? '',
      ]),
    ]
    const csv = filas
      .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'proveedores-illimani.csv'
    enlace.click()
    URL.revokeObjectURL(url)
    setAviso(`Dossier exportado con ${filtrados.length} prestadores.`)
  }

  const hayFiltros = Boolean(tipo || pais || busqueda)

  function limpiar() {
    setTipo('')
    setPais('')
    setBusqueda('')
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Cabecera de archivo ────────────────────────────────────────── */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="coord text-tertiary">Registro de alianzas &amp; talleres · Archivo general</span>
            <span className="text-outline-variant">/</span>
            <span className="coord text-secondary">Serie B-190</span>
          </div>
          <span className="coord flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4 text-terracotta" />
            {metricas.total} prestadores · {metricas.activos} activos
          </span>
        </div>

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-2">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-on-surface sm:text-[2.75rem]">
              Libreta de proveedores &amp; prestadores de confianza
            </h1>
            <p className="font-display text-lg italic text-secondary">
              Aerolíneas, hospedajes, transporte y operadores que sostienen las expediciones de
              Illimani Global Travel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variante="ghost" tamano="sm" onClick={exportar} disabled={filtrados.length === 0}>
              <IconoDescarga className="h-4 w-4" />
              Descargar dossier
            </Button>
            <Button tamano="sm" onClick={abrirNuevo}>
              <IconoMas className="h-4 w-4" />
              Añadir prestador
            </Button>
          </div>
        </div>

        {/* ── Índice de categorías y enclaves ──────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-lg bg-surface-container-low px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="coord mr-1 text-secondary">Categoría:</span>
            <Chip activo={!tipo} onClick={() => setTipo('')}>
              Todos ({proveedores.length})
            </Chip>
            {TIPOS.map((t) => {
              const n = conteoTipos.get(t.valor) ?? 0
              if (n === 0) return null
              return (
                <Chip key={t.valor} activo={tipo === t.valor} onClick={() => setTipo(tipo === t.valor ? '' : t.valor)}>
                  {t.texto} ({n})
                </Chip>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="coord mr-1 text-secondary">Enclave:</span>
            <Chip variante="region" activo={!pais} onClick={() => setPais('')}>
              Global
            </Chip>
            {paises.map((p) => (
              <Chip
                key={p}
                variante="region"
                activo={pais === p}
                onClick={() => setPais(pais === p ? '' : p)}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-md items-center gap-2.5 rounded-full bg-surface-container-lowest px-4 py-2 shadow-sm">
            <IconoLupa className="h-4 w-4 shrink-0 text-terracotta" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, ciudad, enlace o correo..."
              className="w-full bg-transparent font-sans text-sm text-ink-warm outline-none placeholder:text-stamp-sepia/60"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda('')}
                className="rounded-full p-0.5 text-stamp-sepia hover:text-primary"
              >
                <IconoCerrar className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="font-sans text-xs text-stamp-sepia">
            Mostrando <strong className="font-medium text-ink-warm">{filtrados.length}</strong> de{' '}
            {proveedores.length} registros
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                className="ml-2 font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
              >
                Limpiar
              </button>
            )}
          </span>
        </div>
      </header>

      {error && (
        <p className="mt-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mt-6 rounded-md border border-secondary/30 bg-secondary/10 px-4 py-2.5 font-sans text-xs text-secondary">
          {aviso}
        </p>
      )}

      {cargando ? (
        <p className="nota-manuscrita mt-10">Abriendo la libreta de prestadores...</p>
      ) : !seleccionado ? (
        <div className="mt-10 rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
          <p className="font-display text-xl text-on-surface">No hay prestadores en este corte</p>
          <p className="mt-2 font-sans text-sm text-on-surface-variant">
            Ajuste el índice o registre una nueva alianza para el archivo.
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="mt-4 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Pliego abierto: lámina + folio operativo ────────────────── */}
          <section
            id="folio-proveedor"
            className="mt-8 grid scroll-mt-28 grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            {/* Página izquierda: identidad y canal directo */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-5 shadow-paper">
                <div className="absolute right-4 top-4 z-10 -rotate-6 rounded bg-surface-container-highest/90 px-3 py-2 text-center shadow-sm">
                  <span className="block font-sans text-[8px] font-bold uppercase tracking-widest text-primary">
                    Illimani · Red de confianza
                  </span>
                  <IconoSello className="mx-auto my-0.5 h-5 w-5 text-primary" />
                  <span className="block font-sans text-[8px] uppercase tracking-wider text-secondary">
                    {clave(seleccionado.id)}
                  </span>
                </div>

                {/* Lámina del prestador: logotipo subido o sello de la casa */}
                <div className="relative flex h-64 items-center justify-center overflow-hidden rounded bg-gradient-to-br from-surface-container-high via-surface-container-low to-surface-dim">
                  {seleccionado.logo_url ? (
                    <img
                      src={seleccionado.logo_url}
                      alt={seleccionado.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="textura-carta absolute inset-0 opacity-70" />
                      <RosaVientos className="h-40 w-40 text-primary/15" />
                    </>
                  )}
                  <span className="absolute left-4 top-4 rounded bg-surface/85 px-2 py-0.5 coord text-stamp-sepia">
                    Lámina de registro · {seleccionado.tipo_display}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-night/90 via-forest-night/45 to-transparent px-5 pb-4 pt-10">
                    <span className="coord text-surface/75">{ubicacion(seleccionado)}</span>
                    <p className="font-display text-2xl leading-tight text-surface">
                      {seleccionado.nombre}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                  <div>
                    <span className="coord text-secondary">Tipo de prestación</span>
                    <p className="font-sans text-sm font-medium text-on-surface">
                      {seleccionado.tipo_display}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="coord text-secondary">Estado en la red</span>
                    <p className="font-sans text-sm font-medium text-on-surface">
                      {seleccionado.activo ? 'Homologado y activo' : 'Fuera de la red activa'}
                    </p>
                  </div>
                </div>

                <p className="pt-4 font-sans text-sm italic leading-relaxed text-on-surface-variant">
                  {seleccionado.notas
                    ? `«${seleccionado.notas}»`
                    : 'Sin observaciones registradas para este prestador.'}
                </p>
              </div>

              {/* Canal directo */}
              <div className="flex flex-col gap-3 rounded-lg bg-surface-container p-5 shadow-paper">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="coord flex items-center gap-1.5 text-primary">
                    <IconoBuzon className="h-4 w-4" />
                    Canal directo &amp; enlace privado
                  </span>
                  <span className="coord text-secondary">Clave: {clave(seleccionado.id)}</span>
                </div>

                <DatoContacto icono={<IconoPersona className="h-4 w-4" />} etiqueta="Enlace de la casa">
                  {seleccionado.contacto || 'Sin enlace registrado'}
                </DatoContacto>
                <DatoContacto icono={<IconoSobre className="h-4 w-4" />} etiqueta="Correspondencia">
                  {seleccionado.email || 'Sin correo registrado'}
                </DatoContacto>
                <DatoContacto icono={<IconoTelefono className="h-4 w-4" />} etiqueta="Línea directa">
                  {seleccionado.telefono || 'Sin teléfono registrado'}
                </DatoContacto>
                <DatoContacto icono={<IconoUbicacion className="h-4 w-4" />} etiqueta="Enclave del prestador">
                  {ubicacion(seleccionado)}
                </DatoContacto>
              </div>
            </div>

            {/* Página derecha: folio operativo */}
            <div className="flex flex-col gap-5 lg:col-span-7">
              <div className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-6 shadow-paper sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
                  <div>
                    <span className="coord text-tertiary">
                      Folio N.º {String(seleccionado.id).padStart(4, '0')} · Registro maestro
                    </span>
                    <h2 className="font-display text-2xl text-on-surface">
                      Ficha operativa &amp; condiciones del acuerdo
                    </h2>
                  </div>
                  <EstadoPill activo={seleccionado.activo} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <TarjetaDato
                    icono={<IconoMaletin className="h-5 w-5" />}
                    titulo={seleccionado.tipo_display}
                    texto="Categoría homologada dentro de la red de la casa."
                    pie="Registro oficial"
                    tono="terracota"
                  />
                  <TarjetaDato
                    icono={<IconoGlobo className="h-5 w-5" />}
                    titulo={seleccionado.pais ?? 'Sin país'}
                    texto={seleccionado.ciudad ? `Operación declarada en ${seleccionado.ciudad}.` : 'Ciudad de operación pendiente de registro.'}
                    pie={seleccionado.ciudad ?? 'Cobertura por definir'}
                    tono="bosque"
                  />
                  <TarjetaDato
                    icono={<IconoEdificio className="h-5 w-5" />}
                    titulo={seleccionado.contacto ?? 'Enlace pendiente'}
                    texto="Persona o área responsable de coordinar con la agencia."
                    pie="Contacto directo"
                    tono="dorado"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="coord flex items-center gap-1.5 text-secondary">
                      <IconoSello className="h-4 w-4 text-terracotta" />
                      Condiciones &amp; observaciones
                    </span>
                    <span className="coord text-stamp-sepia">Uso interno</span>
                  </div>
                  <p className="rounded-md border-l-2 border-terracotta bg-surface-container px-4 py-3 font-sans text-sm italic leading-relaxed text-on-surface-variant">
                    {seleccionado.notas
                      ? `«${seleccionado.notas}»`
                      : 'Este folio aún no tiene condiciones ni observaciones. Use «Editar folio» para completar la ficha operativa.'}
                  </p>
                </div>

                <dl className="flex flex-col gap-2 rounded-md bg-surface p-4">
                  <FilaDato etiqueta="Clave de archivo" valor={clave(seleccionado.id)} />
                  <FilaDato etiqueta="Tipo" valor={seleccionado.tipo_display} />
                  <FilaDato etiqueta="Enclave" valor={ubicacion(seleccionado)} />
                  <FilaDato etiqueta="Contacto" valor={seleccionado.contacto ?? 'Sin registrar'} />
                  <FilaDato
                    etiqueta="Estado"
                    valor={seleccionado.activo ? 'Activo en la red' : 'Retirado'}
                  />
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-container-low p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 text-primary">
                      <IconoSello className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="coord text-secondary">Red de la casa</p>
                      <p className="font-sans text-sm font-medium text-on-surface">
                        {metricas.total} prestadores · {metricas.activos} activos ·{' '}
                        {metricas.cobertura} países
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void alternarActivo(seleccionado)}
                      disabled={ocupado}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-50"
                    >
                      {seleccionado.activo ? (
                        <IconoPausa className="h-3.5 w-3.5" />
                      ) : (
                        <IconoPlay className="h-3.5 w-3.5" />
                      )}
                      {seleccionado.activo ? 'Retirar' : 'Reactivar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEditar(seleccionado)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-surface shadow-sm transition-colors hover:bg-terracotta hover:text-white"
                    >
                      <IconoLapiz className="h-3.5 w-3.5" />
                      Editar folio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Estantería de la red ─────────────────────────────────────── */}
          <section className="mt-10 flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <div>
                <span className="coord tracking-[0.2em] text-tertiary">
                  Red de homologación internacional
                </span>
                <h2 className="font-display text-2xl text-on-surface">
                  Otros prestadores activos en archivo
                </h2>
              </div>
              <p className="font-sans text-sm italic text-secondary">
                Seleccione un registro para cargar su libreta de condiciones completa.
              </p>
            </div>

            {otros.length === 0 ? (
              <p className="rounded-md border border-dashed border-parchment-border bg-surface-container-lowest px-4 py-10 text-center font-sans text-sm text-on-surface-variant">
                No hay otros prestadores en este corte del archivo.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {otros.slice(0, 6).map((p) => (
                  <TarjetaRed key={p.id} proveedor={p} onSeleccionar={() => seleccionar(p.id)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ProveedorFormModal
        abierto={modalAbierto}
        proveedor={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={(mensaje) => {
          setAviso(mensaje)
          void cargar()
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Piezas                                                                     */
/* -------------------------------------------------------------------------- */

function Chip({
  activo,
  variante = 'tipo',
  onClick,
  children,
}: {
  activo: boolean
  variante?: 'tipo' | 'region'
  onClick: () => void
  children: ReactNode
}) {
  const base =
    variante === 'region'
      ? 'px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em]'
      : 'px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider'
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`shrink-0 rounded-full transition-colors ${base} ${
        activo
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 coord ${
        activo ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-secondary' : 'bg-stamp-sepia'}`} />
      {activo ? 'Acuerdo vigente' : 'Fuera de la red'}
    </span>
  )
}

function DatoContacto({
  icono,
  etiqueta,
  children,
}: {
  icono: ReactNode
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded bg-surface-container-low px-3 py-2">
      <span className="mt-0.5 shrink-0 text-tertiary">{icono}</span>
      <div className="min-w-0">
        <p className="font-sans text-xs font-medium text-secondary">{etiqueta}</p>
        <p className="truncate font-sans text-sm text-on-surface">{children}</p>
      </div>
    </div>
  )
}

function TarjetaDato({
  icono,
  titulo,
  texto,
  pie,
  tono,
}: {
  icono: ReactNode
  titulo: string
  texto: string
  pie: string
  tono: 'terracota' | 'bosque' | 'dorado'
}) {
  const discos: Record<typeof tono, string> = {
    terracota: 'bg-terracotta/10 text-primary',
    bosque: 'bg-secondary/10 text-secondary',
    dorado: 'bg-surface-variant text-terracotta',
  }
  return (
    <div className="flex h-full flex-col justify-between rounded-md bg-surface-container-low p-4">
      <div>
        <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${discos[tono]}`}>
          {icono}
        </span>
        <h3 className="font-display text-lg leading-snug text-on-surface">{titulo}</h3>
        <p className="mt-1 font-sans text-xs leading-relaxed text-secondary">{texto}</p>
      </div>
      <span className="mt-3 coord text-tertiary">{pie}</span>
    </div>
  )
}

function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="coord">{etiqueta}</dt>
      <dd className="min-w-0 truncate font-sans text-xs text-on-surface">{valor}</dd>
    </div>
  )
}

function TarjetaRed({
  proveedor,
  onSeleccionar,
}: {
  proveedor: Proveedor
  onSeleccionar: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSeleccionar}
      className="group flex flex-col justify-between overflow-hidden rounded-lg bg-surface-container-low text-left shadow-paper transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-container"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded bg-surface-container-high">
          {proveedor.logo_url ? (
            <img
              src={proveedor.logo_url}
              alt={proveedor.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="textura-carta absolute inset-0 opacity-60" />
              <span className="font-display text-4xl text-primary/25">
                {iniciales(proveedor.nombre) || 'ILL'}
              </span>
            </>
          )}
          <span className="absolute left-2 top-2 rounded bg-surface/90 px-2 py-0.5 coord text-on-surface">
            {proveedor.pais ?? 'Global'}
            {proveedor.ciudad ? ` · ${proveedor.ciudad}` : ''}
          </span>
          <span className="absolute bottom-2 right-2 rounded bg-terracotta px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-white">
            {proveedor.tipo_display}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="coord text-secondary">{clave(proveedor.id)}</span>
            <span
              className={`coord ${proveedor.activo ? 'text-secondary' : 'text-stamp-sepia'}`}
            >
              {proveedor.activo ? 'Activo' : 'Retirado'}
            </span>
          </div>
          <h3 className="mt-0.5 font-display text-xl text-on-surface transition-colors group-hover:text-primary">
            {proveedor.nombre}
          </h3>
          <p className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-secondary">
            {proveedor.notas ?? 'Sin observaciones registradas.'}
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between gap-3 rounded bg-surface-container-lowest/70 px-3 py-2">
        <div className="min-w-0">
          <span className="coord text-[9px] text-secondary">Enlace directo</span>
          <p className="truncate font-sans text-xs font-medium text-on-surface">
            {proveedor.contacto ?? proveedor.email ?? 'Sin contacto'}
          </p>
        </div>
        <IconoFlechaDerecha className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}

interface FormProveedor {
  nombre: string
  tipo: string
  pais: string
  ciudad: string
  contacto: string
  email: string
  telefono: string
  notas: string
  logo_url: string
  logo_public_id: string
}

const FORM_VACIO: FormProveedor = {
  nombre: '',
  tipo: 'hotel',
  pais: '',
  ciudad: '',
  contacto: '',
  email: '',
  telefono: '',
  notas: '',
  logo_url: '',
  logo_public_id: '',
}

function textoOpcional(valor: string): string | null {
  const limpio = valor.trim()
  return limpio === '' ? null : limpio
}

/** Alta y edición de la ficha operativa de un prestador. */
function ProveedorFormModal({
  abierto,
  proveedor,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean
  proveedor: Proveedor | null
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}) {
  const [form, setForm] = useState<FormProveedor>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setForm(
      proveedor
        ? {
            nombre: proveedor.nombre,
            tipo: proveedor.tipo,
            pais: proveedor.pais ?? '',
            ciudad: proveedor.ciudad ?? '',
            contacto: proveedor.contacto ?? '',
            email: proveedor.email ?? '',
            telefono: proveedor.telefono ?? '',
            notas: proveedor.notas ?? '',
            logo_url: proveedor.logo_url ?? '',
            logo_public_id: proveedor.logo_public_id ?? '',
          }
        : FORM_VACIO,
    )
  }, [abierto, proveedor])

  function campo<K extends keyof FormProveedor>(claveCampo: K, valor: FormProveedor[K]) {
    setForm((f) => ({ ...f, [claveCampo]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre del prestador es obligatorio.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        pais: textoOpcional(form.pais),
        ciudad: textoOpcional(form.ciudad),
        contacto: textoOpcional(form.contacto),
        email: textoOpcional(form.email),
        telefono: textoOpcional(form.telefono),
        notas: textoOpcional(form.notas),
        logo_url: textoOpcional(form.logo_url),
        logo_public_id: textoOpcional(form.logo_public_id),
      }
      if (proveedor) {
        await catalogoApi.actualizarProveedor(proveedor.id, payload)
        onGuardado('Folio del prestador actualizado.')
      } else {
        await catalogoApi.crearProveedor(payload)
        onGuardado('Prestador ingresado al archivo oficial.')
      }
      onCerrar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const claseCampo =
    'w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary'

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      titulo={proveedor ? 'Editar folio del prestador' : 'Ficha de homologación de proveedor'}
    >
      <p className="coord mb-4 text-primary">
        {proveedor ? `Registro ${clave(proveedor.id)} · Archivo general` : 'Registro de nueva alianza · Archivo general'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SubidorImagen
              valor={form.logo_url}
              publicId={form.logo_public_id || null}
              onChange={(url, publicId) => {
                setForm((f) => ({ ...f, logo_url: url, logo_public_id: publicId ?? '' }))
              }}
              carpeta="proveedores"
              etiqueta="Lámina del prestador (logotipo o sede)"
              ayuda="JPG, PNG, WEBP o AVIF · hasta 8 MB. Se muestra en la libreta y en la ficha."
            />
          </div>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Nombre del prestador o taller *</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => campo('nombre', e.target.value)}
              placeholder="Ej. Inkaterra Eco-Lodge"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Tipología de prestación</span>
            <select
              value={form.tipo}
              onChange={(e) => campo('tipo', e.target.value)}
              className={claseCampo}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.texto}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">País del enclave</span>
            <input
              type="text"
              value={form.pais}
              onChange={(e) => campo('pais', e.target.value)}
              placeholder="Ej. Perú"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Ciudad o región</span>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => campo('ciudad', e.target.value)}
              placeholder="Ej. Machu Picchu"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Contacto directo / guardián</span>
            <input
              type="text"
              value={form.contacto}
              onChange={(e) => campo('contacto', e.target.value)}
              placeholder="Persona o área de enlace"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Correo de coordinación</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => campo('email', e.target.value)}
              placeholder="reservas@proveedor.com"
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="coord">Teléfono directo</span>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => campo('telefono', e.target.value)}
              placeholder="+591 ..."
              className={claseCampo}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="coord">Condiciones &amp; observaciones internas</span>
            <textarea
              value={form.notas}
              onChange={(e) => campo('notas', e.target.value)}
              rows={3}
              placeholder="Detalle acuerdos, horarios de coordinación o condiciones especiales..."
              className={`${claseCampo} resize-none`}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-md border border-error/40 bg-error-container/50 px-3 py-2 font-sans text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary transition-colors hover:text-on-surface"
          >
            Cancelar
          </button>
          <Button type="submit" tamano="sm" disabled={enviando}>
            {enviando ? 'Guardando...' : proveedor ? 'Guardar folio' : 'Ingresar al archivo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}