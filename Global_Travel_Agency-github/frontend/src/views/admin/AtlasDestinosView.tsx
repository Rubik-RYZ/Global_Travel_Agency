import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { catalogoApi, type Destino, type FiltrosDestino } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import { Button } from '@/components/ui/Button/Button'
import {
  IconoDestello,
  IconoEdificio,
  IconoFlechaDerecha,
  IconoLibro,
  IconoLapiz,
  IconoLupa,
  IconoMapa,
  IconoMas,
  IconoPausa,
  IconoPlay,
  IconoRayo,
  IconoSello,
} from '@/components/ui/Iconos'
import { CARACTERES, ORDEN_REGIONES } from '@/hooks/useCuadernoDestinos'
import {
  coordenadas,
  etiquetaRegion,
  latitudCorta,
  NOTA_MANO,
  nombrePais,
  precioDesde,
} from '@/lib/editorial'
import { useAuthStore } from '@/store/authStore'
import { esAdmin } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function romano(n: number): string {
  return ROMANOS[n - 1] ?? String(n)
}

/** Cursor/cabecera del atlas por número de lámina. */
function capitulo(d: Destino, i: number): string {
  return `Capítulo ${romano(i + 1)} · ${nombrePais(d.pais, d.pais_codigo)}`
}

/** Opciones de continente para el selector de la cápsula de búsqueda. */
const OPCIONES_CONTINENTE = [
  { valor: '', texto: 'Todos los cuadernos' },
  ...ORDEN_REGIONES.map((r) => ({ valor: r, texto: etiquetaRegion(r) })),
]

const OPCIONES_ESTADO = [
  { valor: '', texto: 'Cualquier estado' },
  { valor: 'publicado', texto: 'Publicado en el atlas' },
  { valor: 'insignia', texto: 'Con insignia de autor' },
  { valor: 'fuera', texto: 'Fuera de catálogo' },
]

type Vista = 'grid' | 'list'

/**
 * 17. Panel · Atlas Maestro de Enclaves → /admin/destinos
 *
 * Catálogo de destinos con la veta editorial del cuaderno de viajes: fichas
 * comerciales reales (duración, inversión, carácter) y acciones de curación.
 * El personal recibe el destino completo (con `activo`), de modo que el filtro
 * por estado se resuelve en el cliente sobre una sola carga del catálogo.
 */
export function AtlasDestinosView() {
  const usuario = useAuthStore((s) => s.usuario)
  const puedeEditar = esAdmin(usuario?.rol) || usuario?.rol === 'agente'
  const puedeSuspender = esAdmin(usuario?.rol)

  const [destinos, setDestinos] = useState<Destino[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [borrador, setBorrador] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [continente, setContinente] = useState('')
  const [estado, setEstado] = useState('')
  const [caracter, setCaracter] = useState('')
  const [vista, setVista] = useState<Vista>('grid')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const acc: Destino[] = []
      let pagina = 1
      for (;;) {
        const filtros: FiltrosDestino = { page: pagina }
        const data = await catalogoApi.listarDestinosAdmin(filtros)
        acc.push(...data.results)
        if (!data.next) break
        pagina += 1
      }
      setDestinos(acc)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return destinos.filter((d) => {
      if (q) {
        const pajar = `${d.nombre} ${d.pais} ${d.resumen ?? ''} ${d.slug ?? ''}`.toLowerCase()
        if (!pajar.includes(q)) return false
      }
      if (continente && d.region !== continente) return false
      if (caracter && d.caracter !== caracter) return false
      if (estado === 'publicado' && !d.activo) return false
      if (estado === 'fuera' && d.activo) return false
      if (estado === 'insignia' && !d.destacado) return false
      return true
    })
  }, [destinos, busqueda, continente, caracter, estado])

  const metricas = useMemo(() => {
    const publicados = destinos.filter((d) => d.activo).length
    const insignia = destinos.filter((d) => d.destacado).length
    return { total: destinos.length, publicados, insignia }
  }, [destinos])

  const hayFiltros = Boolean(busqueda || continente || estado || caracter)

  function limpiar() {
    setBorrador('')
    setBusqueda('')
    setContinente('')
    setEstado('')
    setCaracter('')
  }

  async function alternarDestacado(d: Destino) {
    try {
      await catalogoApi.actualizarDestino(d.id, { destacado: !d.destacado })
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  async function alternarActivo(d: Destino) {
    try {
      await catalogoApi.toggleActivoDestino(d.id)
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── SECTION 1 · Cabecera maestra y métricas ─────────────────────── */}
      <header className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-high px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            <span className="coord">
              Libro de registro · Custodia y catálogo oficial · CU3 · RF-08
            </span>
          </div>
          <div className="flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Curaduría aprobada por el atelier</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="coord flex items-center gap-2 text-terracotta">
              <span className="regla-terracotta" />
              Atelier de expediciones de autor
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-primary sm:text-5xl">
              Atlas maestro de enclaves &amp; expediciones de autor
            </h1>
            <p className="font-display text-lg font-normal italic text-on-surface-variant">
              Tomo III — Curaduría cartográfica, preservación patrimonial y gestión de rutas
              privadas de Illimani Global Travel.
            </p>
          </div>

          {puedeEditar && (
            <Link to="/admin/destinos/nuevo" className="shrink-0">
              <Button className="group">
                <IconoEdificio className="h-4 w-4" />
                Catalogar nuevo enclave
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Placas de métricas */}
        <div className="grid gap-5 pt-2 md:grid-cols-3">
          <Metrica
            etiqueta="Enclaves archivados"
            valor={metricas.total}
            nota="Con cuaderno de bitácora y cartografía verificada."
            icono={<IconoMapa className="h-5 w-5" />}
            tono="terracota"
          />
          <Metrica
            etiqueta="Publicados en el atlas"
            valor={metricas.publicados}
            nota="Visibles hoy en el sitio para el viajero."
            icono={<IconoRayo className="h-5 w-5" />}
            tono="bosque"
          />
          <Metrica
            etiqueta="Insignia de autor"
            valor={metricas.insignia}
            nota="Láminas destacadas en la portada y el mega-menú."
            icono={<IconoDestello className="h-5 w-5" />}
            tono="dorado"
          />
        </div>
      </header>

      {/* ── SECTION 2 · Cápsula de búsqueda y filtros ──────────────────── */}
      <section className="mt-10 flex flex-col gap-5 rounded-lg bg-surface-container-low p-6 shadow-paper sm:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setBusqueda(borrador)
          }}
          className="flex flex-col items-center justify-between gap-2 rounded-full bg-surface-container-lowest p-2 shadow-sm lg:flex-row"
        >
          <div className="flex w-full items-center gap-3.5 px-5 py-3 lg:w-2/5">
            <IconoLupa className="h-5 w-5 shrink-0 text-terracotta" />
            <div className="flex w-full flex-col">
              <span className="coord">Búsqueda cartográfica</span>
              <input
                type="text"
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                placeholder="Buscar por nombre, país o temática…"
                className="w-full bg-transparent font-sans text-sm text-ink-warm outline-none placeholder:text-stamp-sepia/60"
              />
            </div>
          </div>

          <div className="hidden h-10 w-px bg-surface-dim lg:block" />

          <div className="flex w-full items-center gap-6 px-4 py-2 lg:w-auto">
            <label className="flex flex-col">
              <span className="coord">Continente</span>
              <select
                value={continente}
                onChange={(e) => setContinente(e.target.value)}
                className="cursor-pointer bg-transparent pr-4 font-display text-lg text-primary outline-none"
              >
                {OPCIONES_CONTINENTE.map((o) => (
                  <option key={o.valor || 'todos'} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden h-8 w-px bg-surface-dim sm:block" />
            <label className="hidden flex-col sm:flex">
              <span className="coord">Estado en el atlas</span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="cursor-pointer bg-transparent font-sans text-sm text-ink-warm outline-none"
              >
                {OPCIONES_ESTADO.map((o) => (
                  <option key={o.valor || 'cualquiera'} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-night px-7 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-surface transition-colors hover:bg-ink-warm lg:w-auto"
          >
            <IconoLupa className="h-4 w-4" />
            Filtrar atlas
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="coord mr-1">Carácter del viaje:</span>
            <Chip activo={!caracter} onClick={() => setCaracter('')}>
              Todos los ritmos
            </Chip>
            {CARACTERES.map((c) => (
              <Chip
                key={c.clave}
                activo={caracter === c.clave}
                onClick={() => setCaracter(caracter === c.clave ? '' : c.clave)}
              >
                {c.nombre}
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-3 text-stamp-sepia">
            <span className="font-sans text-xs">
              Mostrando{' '}
              <strong className="font-medium text-ink-warm">
                {filtrados.length} de {destinos.length}
              </strong>{' '}
              expediciones
            </span>
            <div className="flex items-center rounded-full bg-surface-container p-1">
              <button
                type="button"
                aria-label="Vista de láminas"
                aria-pressed={vista === 'grid'}
                onClick={() => setVista('grid')}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  vista === 'grid'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <IconoLibro className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Vista de registro"
                aria-pressed={vista === 'list'}
                onClick={() => setVista('list')}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  vista === 'list'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <IconoSello className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="mt-6 rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
          {error}
        </p>
      )}

      {/* ── SECTION 3 · Láminas abiertas al viajero ────────────────────── */}
      <section className="mt-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl text-primary">Pliegos abiertos al viajero</span>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 coord text-secondary">
              Verificadas
            </span>
          </div>
          <span className="coord hidden sm:inline-flex">Orden: orden geodésico</span>
        </div>

        {cargando ? (
          <p className="nota-manuscrita">Abriendo el atlas de enclaves…</p>
        ) : filtrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-parchment-border bg-surface-container-lowest px-6 py-16 text-center">
            <p className="font-display text-xl text-on-surface">Sin enclaves que mostrar</p>
            <p className="mt-2 font-sans text-sm text-on-surface-variant">
              Ajuste la búsqueda o catalogue un nuevo enclave para el atlas.
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
        ) : vista === 'grid' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {filtrados.map((d, i) => (
              <LaminaEnclave
                key={d.id}
                destino={d}
                indice={i}
                puedeSuspender={puedeSuspender}
                onAlternarActivo={() => alternarActivo(d)}
                onAlternarDestacado={() => alternarDestacado(d)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-parchment-border bg-surface-container-low">
                  <th className="coord px-5 py-3 font-normal">Enclave</th>
                  <th className="coord hidden px-5 py-3 font-normal sm:table-cell">Región</th>
                  <th className="coord hidden px-5 py-3 font-normal md:table-cell">Duración</th>
                  <th className="coord px-5 py-3 font-normal">Inversión</th>
                  <th className="coord px-5 py-3 font-normal">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => (
                  <FilaEnclave key={d.id} destino={d} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SECTION 4 · Pie editorial ──────────────────────────────────── */}
      <section className="relative mt-12 flex flex-col items-center justify-between gap-8 overflow-hidden rounded-lg bg-surface-container p-8 md:flex-row lg:p-12">
        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.07]">
          <RosaVientos className="h-64 w-64 text-forest-night" />
        </div>
        <div className="relative z-10 flex max-w-2xl flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-stamp-sepia">
            <IconoSello className="h-4 w-4" />
            <span className="coord">Vitrina pública del catálogo</span>
          </div>
          <h3 className="font-display text-2xl text-primary">
            Este atlas alimenta la portada y el explorador del sitio
          </h3>
          <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
            Cada enclave publicado se refleja en el Cuaderno de Destinos, la portada y la ficha
            pública. Los que están fuera de catálogo se conservan aquí sin mostrarse al viajero.
          </p>
        </div>
        <div className="relative z-10 flex w-full flex-col items-center gap-4 sm:flex-row md:w-auto">
          <Link to="/destinos" className="w-full sm:w-auto">
            <Button variante="secondary" className="w-full sm:w-auto">
              Abrir explorador público
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variante="ghost" className="w-full sm:w-auto">
              Ver portada
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Piezas                                                                     */
/* -------------------------------------------------------------------------- */

function Metrica({
  etiqueta,
  valor,
  nota,
  icono,
  tono,
}: {
  etiqueta: string
  valor: number
  nota: string
  icono: ReactNode
  tono: 'terracota' | 'bosque' | 'dorado'
}) {
  const discos: Record<typeof tono, string> = {
    terracota: 'bg-terracotta/10 text-primary',
    bosque: 'bg-secondary/10 text-secondary',
    dorado: 'bg-surface-variant text-terracotta',
  }
  return (
    <div className="group relative flex items-start justify-between gap-4 overflow-hidden rounded-lg bg-parchment p-6 shadow-paper">
      <div className="flex flex-col gap-1.5">
        <span className="coord">{etiqueta}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none text-primary">
            {String(valor).padStart(2, '0')}
          </span>
          <span className="font-sans text-sm text-secondary">registradas</span>
        </div>
        <p className="font-sans text-xs text-on-surface-variant">{nota}</p>
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${discos[tono]}`}
      >
        {icono}
      </div>
    </div>
  )
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 font-sans text-xs transition-colors ${
        activo
          ? 'bg-surface-container-high font-medium text-primary'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  )
}

/** Sello postal circular con el código del país y su latitud. */
function SelloPostal({ destino }: { destino: Destino }) {
  return (
    <div className="flex h-16 w-16 -rotate-6 flex-col items-center justify-center rounded-full bg-parchment/90 p-1.5 text-center text-primary shadow-sm backdrop-blur-sm">
      <span className="font-sans text-[7px] font-semibold uppercase leading-tight tracking-wider">
        Sigillum
      </span>
      <span className="font-display text-sm font-bold leading-none text-terracotta">
        {destino.pais_codigo ?? 'ILL'}
      </span>
      <span className="font-sans text-[6px] uppercase text-stamp-sepia">
        {latitudCorta(destino.latitud) ?? 'Illimani'}
      </span>
    </div>
  )
}

function EstadoPill({ destino }: { destino: Destino }) {
  if (!destino.activo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 coord text-on-surface-variant">
        <span className="h-1.5 w-1.5 rounded-full bg-stamp-sepia" />
        Fuera de catálogo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 coord text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
      Activo en catálogo
    </span>
  )
}

function LaminaEnclave({
  destino,
  indice,
  puedeSuspender,
  onAlternarActivo,
  onAlternarDestacado,
}: {
  destino: Destino
  indice: number
  puedeSuspender: boolean
  onAlternarActivo: () => void
  onAlternarDestacado: () => void
}) {
  const region = destino.region ? etiquetaRegion(destino.region, destino.region_display) : null
  const nota = destino.lema ?? NOTA_MANO[destino.slug ?? ''] ?? destino.resumen
  const precio = precioDesde(destino.precio_desde, destino.moneda)
  const coords = coordenadas(destino.latitud, destino.longitud)

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-lg bg-parchment shadow-paper transition-all duration-300 hover:shadow-paper-lg">
      <div className="flex flex-col gap-6 p-7 sm:p-9">
        {/* Registro superior */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="coord text-terracotta">{capitulo(destino, indice)}</span>
            {coords && <span className="coord">{coords}</span>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <EstadoPill destino={destino} />
            {destino.destacado && (
              <span className="inline-flex items-center gap-1 coord text-terracotta">
                <IconoDestello className="h-3 w-3" />
                Insignia de autor
              </span>
            )}
          </div>
        </div>

        {/* Lámina */}
        <div className="relative h-72 overflow-hidden rounded-xl bg-surface-dim sm:h-80">
          {destino.imagen_principal ? (
            <img
              src={destino.imagen_principal}
              alt={destino.nombre}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stamp-sepia/40">
              <RosaVientos className="h-32 w-32" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-night/60 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <SelloPostal destino={destino} />
            {region && (
              <div className="rounded-full bg-forest-night/80 px-3 py-1 coord text-surface backdrop-blur-sm">
                {region}
              </div>
            )}
          </div>

          {nota && (
            <div className="absolute right-4 top-4 max-w-[60%] rounded-full bg-parchment/90 px-3 py-1 font-hand text-sm italic text-ink-warm shadow-sm backdrop-blur-sm">
              “{nota}”
            </div>
          )}
        </div>

        {/* Título y narrativa */}
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display text-2xl text-primary transition-colors group-hover:text-terracotta">
            {destino.nombre}
          </h2>
          {destino.resumen && (
            <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
              {destino.resumen}
            </p>
          )}
        </div>

        {/* Tabla de espécimen (datos comerciales reales) */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-container p-4 sm:grid-cols-3">
          <Especimen
            etiqueta="Duración"
            valor={
              destino.duracion_dias
                ? `${destino.duracion_dias} días / ${destino.duracion_noches ?? 0} noches`
                : 'Por definir'
            }
          />
          <Especimen etiqueta="Inversión" valor={precio ?? 'A cotizar'} />
          <Especimen
            etiqueta="Carácter"
            valor={destino.caracter_display ?? 'Sin clasificar'}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </div>

      {/* Franja de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-high px-7 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/admin/destinos/${destino.id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-sans text-xs text-ink-warm shadow-sm transition-colors hover:bg-terracotta hover:text-white"
          >
            <IconoLapiz className="h-4 w-4" />
            Editar cuaderno
          </Link>
          <button
            type="button"
            onClick={onAlternarDestacado}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs transition-colors ${
              destino.destacado
                ? 'bg-terracotta/10 text-primary'
                : 'bg-surface text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <IconoDestello className="h-4 w-4" />
            {destino.destacado ? 'Con insignia' : 'Dar insignia'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {puedeSuspender && (
            <button
              type="button"
              onClick={onAlternarActivo}
              title={destino.activo ? 'Suspender salidas temporalmente' : 'Volver a publicar'}
              className="rounded-full p-1.5 text-stamp-sepia transition-colors hover:bg-surface hover:text-error"
            >
              {destino.activo ? (
                <IconoPausa className="h-4 w-4" />
              ) : (
                <IconoPlay className="h-4 w-4" />
              )}
            </button>
          )}
          <Link
            to={`/destinos/${destino.id}`}
            className="inline-flex items-center gap-1 coord text-terracotta transition-transform group-hover:translate-x-1"
          >
            Abrir pliego
            <IconoFlechaDerecha className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function Especimen({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string
  valor: string
  className?: string
}) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className="coord">{etiqueta}</span>
      <span className="font-sans text-[13px] font-medium leading-snug text-ink-warm">{valor}</span>
    </div>
  )
}

function FilaEnclave({ destino }: { destino: Destino }) {
  const region = destino.region ? etiquetaRegion(destino.region, destino.region_display) : '—'
  const precio = precioDesde(destino.precio_desde, destino.moneda)
  return (
    <tr className="border-b border-parchment-border/60 last:border-0 hover:bg-surface-container-low">
      <td className="px-5 py-3.5">
        <Link
          to={`/destinos/${destino.id}`}
          className="font-display text-lg text-on-surface hover:text-primary"
        >
          {destino.nombre}
        </Link>
        <span className="coord mt-0.5 block">
          {nombrePais(destino.pais, destino.pais_codigo)}
          {destino.slug ? ` · ${destino.slug}` : ''}
        </span>
      </td>
      <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant sm:table-cell">
        {region}
      </td>
      <td className="hidden px-5 py-3.5 font-sans text-sm text-on-surface-variant md:table-cell">
        {destino.duracion_dias ? `${destino.duracion_dias} d / ${destino.duracion_noches ?? 0} n` : '—'}
      </td>
      <td className="px-5 py-3.5 font-sans text-sm text-on-surface">
        {precio ?? 'A cotizar'}
      </td>
      <td className="px-5 py-3.5">
        <EstadoPill destino={destino} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <Link
          to={`/admin/destinos/${destino.id}/editar`}
          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-terracotta"
        >
          <IconoMas className="h-3.5 w-3.5" />
          Editar
        </Link>
      </td>
    </tr>
  )
}
