import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { catalogoApi, type Destino, type ItinerarioDia } from '@/api/catalogo'
import { RosaVientos } from '@/components/brand/RosaVientos'
import { Button } from '@/components/ui/Button/Button'
import { SubidorImagen } from '@/components/ui/SubidorImagen/SubidorImagen'
import {
  IconoCerrar,
  IconoDestello,
  IconoFlechaIzquierda,
  IconoFlechaDerecha,
  IconoLibro,
  IconoMapa,
  IconoMas,
  IconoPlay,
  IconoPausa,
  IconoSello,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { CARACTERES, ORDEN_REGIONES } from '@/hooks/useCuadernoDestinos'
import { coordenadas, etiquetaRegion, nombrePais } from '@/lib/editorial'
import { useAuthStore } from '@/store/authStore'
import { INTERESES, MONEDAS, textoInteres } from '@/utils/catalogos'
import { esAdmin } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'

const OPCIONES_REGION = [
  { valor: '', texto: 'Sin clasificar' },
  ...ORDEN_REGIONES.map((r) => ({ valor: r, texto: etiquetaRegion(r) })),
]

const OPCIONES_CARACTER = [
  { valor: '', texto: 'Sin clasificar' },
  ...CARACTERES.map((c) => ({ valor: c.clave, texto: c.nombre })),
]

type Pestana = 'geografia' | 'itinerario' | 'inclusiones' | 'clasificacion'

interface Fila {
  titulo: string
  descripcion: string
  ubicacion: string
}

interface FormDestino {
  nombre: string
  pais: string
  pais_codigo: string
  region: string
  caracter: string
  latitud: string
  longitud: string
  duracion_dias: string
  duracion_noches: string
  precio_desde: string
  moneda: string
  mejor_epoca: string
  imagen_principal: string
  imagen_public_id: string
  resumen: string
  lema: string
  descripcion: string
  destacado: boolean
  activo: boolean
  incluye: string[]
  no_incluye: string[]
  etiquetas: string[]
}

const FORM_VACIO: FormDestino = {
  nombre: '',
  pais: '',
  pais_codigo: '',
  region: '',
  caracter: '',
  latitud: '',
  longitud: '',
  duracion_dias: '',
  duracion_noches: '',
  precio_desde: '',
  moneda: 'USD',
  mejor_epoca: '',
  imagen_principal: '',
  imagen_public_id: '',
  resumen: '',
  lema: '',
  descripcion: '',
  destacado: false,
  activo: true,
  incluye: [],
  no_incluye: [],
  etiquetas: [],
}

/** Cadena → número o `null` (el API acepta nulos en los campos opcionales). */
function numero(valor: string): number | null {
  const limpio = valor.trim()
  if (limpio === '') return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}

/** Cadena → decimal normalizado o `null` (latitud/longitud viajan como texto). */
function decimal(valor: string): string | null {
  const limpio = valor.trim()
  if (limpio === '') return null
  return Number.isFinite(Number(limpio)) ? limpio : null
}

/** Cadena → texto o `null`. */
function texto(valor: string): string | null {
  const limpio = valor.trim()
  return limpio === '' ? null : limpio
}

function registro(id: number): string {
  return `REGISTRO N.o ${String(id).padStart(3, '0')}`
}

/**
 * 18. Panel · Editor de Enclave → /admin/destinos/:id/editar (y /nuevo)
 *
 * Manuscrito de trabajo del curador: parámetros comerciales reales, diario de
 * ruta día a día, privilegios de la expedición y clasificación del recomendador.
 * La vista lateral resume el estado de publicación y la completitud de la ficha.
 */
export function EditorDestinoView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const esNuevo = !id
  const destinoId = id ? Number(id) : null

  const [form, setForm] = useState<FormDestino>(FORM_VACIO)
  const [dias, setDias] = useState<Fila[]>([])
  const [pestana, setPestana] = useState<Pestana>('geografia')
  const [cargando, setCargando] = useState(!esNuevo)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const asignar = useCallback(<K extends keyof FormDestino>(campo: K, valor: FormDestino[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }))
  }, [])

  const cargar = useCallback(async () => {
    if (destinoId == null) return
    setCargando(true)
    setError(null)
    try {
      const d = await catalogoApi.obtenerDestino(destinoId)
      setForm(mapearDestino(d))
      setDias(d.itinerario.map((i) => filaDe(i)))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [destinoId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  /** Completa los campos obligatorios de la ficha, para el resumen de cierre. */
  const validacion = useMemo(() => {
    const items = [
      { texto: 'Nombre y país del enclave', ok: Boolean(form.nombre.trim() && form.pais.trim()) },
      { texto: 'Región y carácter clasificados', ok: Boolean(form.region && form.caracter) },
      {
        texto: 'Duración e inversión referencial',
        ok: Boolean(form.duracion_dias.trim() && form.precio_desde.trim()),
      },
      { texto: 'Imagen principal de la lámina', ok: Boolean(form.imagen_principal.trim()) },
      { texto: 'Sinopsis curatorial', ok: Boolean(form.resumen.trim()) },
      { texto: 'Diario de ruta con al menos un día', ok: dias.some((d) => d.titulo.trim()) },
    ]
    return { items, listos: items.filter((i) => i.ok).length }
  }, [form, dias])

  async function guardar(publicar?: boolean) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        pais: form.pais.trim(),
        pais_codigo: texto(form.pais_codigo)?.toUpperCase() ?? null,
        region: texto(form.region),
        caracter: texto(form.caracter),
        latitud: decimal(form.latitud),
        longitud: decimal(form.longitud),
        duracion_dias: numero(form.duracion_dias),
        duracion_noches: numero(form.duracion_noches),
        precio_desde: texto(form.precio_desde),
        moneda: form.moneda,
        mejor_epoca: texto(form.mejor_epoca),
        imagen_principal: texto(form.imagen_principal),
        imagen_public_id: texto(form.imagen_public_id),
        resumen: texto(form.resumen),
        lema: texto(form.lema),
        descripcion: texto(form.descripcion),
        destacado: form.destacado,
        activo: publicar === undefined ? form.activo : publicar,
        incluye: form.incluye,
        no_incluye: form.no_incluye,
        etiquetas: form.etiquetas,
      }

      const guardado = destinoId
        ? await catalogoApi.actualizarDestino(destinoId, payload)
        : await catalogoApi.crearDestino(payload)

      const filas = dias
        .filter((d) => d.titulo.trim())
        .map<Omit<ItinerarioDia, 'id'>>((d, i) => ({
          numero_dia: i + 1,
          titulo: d.titulo.trim(),
          descripcion: texto(d.descripcion),
          ubicacion: texto(d.ubicacion),
        }))
      await catalogoApi.definirItinerario(guardado.id, filas)

      setForm(mapearDestino(guardado))
      setAviso(publicar === undefined ? 'Cuaderno guardado en el archivo.' : 'Estado de publicación actualizado.')
      if (esNuevo) {
        navigate(`/admin/destinos/${guardado.id}/editar`, { replace: true })
      }
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  const coords = coordenadas(texto(form.latitud), texto(form.longitud))

  if (cargando) {
    return <p className="nota-manuscrita">Abriendo el cuaderno de bitácora…</p>
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Cabecera de despacho ───────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-6 border-b border-outline-variant/40 pb-5 md:flex-row md:items-end">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="coord flex items-center gap-1.5 text-primary">
              <IconoLibro className="h-3.5 w-3.5" />
              Archivo cartográfico · {destinoId ? registro(destinoId) : 'Nuevo ingreso'}
            </span>
            <span className="text-outline-variant">/</span>
            <span className="coord text-secondary">
              {form.pais ? nombrePais(form.pais, form.pais_codigo) : 'Serie por definir'}
            </span>
            {!esNuevo && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 coord ${
                  form.activo ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {form.activo ? 'Publicado' : 'Fuera de catálogo'}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-on-surface sm:text-4xl">
            Editor de enclave · {form.nombre || 'Nuevo enclave'}
          </h1>
          <p className="max-w-3xl font-display text-lg italic text-secondary">
            «{form.lema || form.resumen || 'Titule el enclave y describa su relato de viaje.'}»
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SelloArchivo publicado={form.activo} />
          {destinoId && (
            <Link to={`/destinos/${destinoId}`} className="shrink-0">
              <Button variante="ghost" tamano="sm">
                <IconoMapa className="h-4 w-4" />
                Vista previa pública
              </Button>
            </Link>
          )}
          <Button variante="secondary" tamano="sm" onClick={() => void guardar()} disabled={guardando}>
            <IconoSello className="h-4 w-4" />
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
          {esAdmin(usuario?.rol) && (
          <Button
            tamano="sm"
            onClick={() => void guardar(!form.activo)}
            disabled={guardando || (!form.nombre.trim() && esNuevo)}
          >
            {form.activo ? <IconoPausa className="h-4 w-4" /> : <IconoPlay className="h-4 w-4" />}
            {form.activo ? 'Retirar del catálogo' : 'Publicar en catálogo'}
          </Button>
          )}
        </div>
      </div>

      {/* ── Pestañas editoriales ───────────────────────────────────────── */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-outline-variant/30 pb-1">
        {(
          [
            ['geografia', 'Ficha geográfica', <IconoMapa key="a" className="h-4 w-4" />],
            ['itinerario', 'Hitos del itinerario', <IconoUbicacion key="b" className="h-4 w-4" />],
            ['inclusiones', 'Privilegios e inclusiones', <IconoSello key="c" className="h-4 w-4" />],
            ['clasificacion', 'Clasificación y etiquetas', <IconoDestello key="d" className="h-4 w-4" />],
          ] as [Pestana, string, ReactNode][]
        ).map(([clave, titulo, icono], i) => {
          const activa = pestana === clave
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setPestana(clave)}
              aria-pressed={activa}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                activa
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              {icono}
              {i + 1}. {titulo}
            </button>
          )
        })}
      </div>

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

      {/* ── Espacio de trabajo (8 / 4) ─────────────────────────────────── */}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          {pestana === 'geografia' && (
            <>
              <Seccion titulo="Parámetros maestros del enclave" nota="Sección I · Cartografía base">
                <div className="grid gap-5 md:grid-cols-2">
                  <Campo
                    etiqueta="Denominación cartográfica del cuaderno"
                    requerido
                    ayuda="Título editorial visible en las cartas de expedición y pasaportes."
                    className="md:col-span-2"
                  >
                    <Entrada
                      value={form.nombre}
                      onChange={(v) => asignar('nombre', v)}
                      placeholder="Ej. Kioto imperial y los senderos de Takayama"
                    />
                  </Campo>

                  <Campo etiqueta="País" requerido>
                    <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                      <Entrada
                        value={form.pais}
                        onChange={(v) => asignar('pais', v)}
                        placeholder="Japón"
                      />
                      <Entrada
                        value={form.pais_codigo}
                        onChange={(v) => asignar('pais_codigo', v.toUpperCase().slice(0, 2))}
                        placeholder="JP"
                        maxLength={2}
                        className="uppercase"
                      />
                    </div>
                  </Campo>

                  <Campo etiqueta="Región geográfica &amp; cuenca">
                    <Selector
                      value={form.region}
                      onChange={(v) => asignar('region', v)}
                      opciones={OPCIONES_REGION}
                    />
                  </Campo>

                  <Campo etiqueta="Coordenadas fijas de referencia">
                    <div className="grid grid-cols-2 gap-2">
                      <Entrada
                        value={form.latitud}
                        onChange={(v) => asignar('latitud', v)}
                        placeholder="Latitud · -13.163"
                        inputMode="decimal"
                      />
                      <Entrada
                        value={form.longitud}
                        onChange={(v) => asignar('longitud', v)}
                        placeholder="Longitud · -72.545"
                        inputMode="decimal"
                      />
                    </div>
                  </Campo>

                  <Campo etiqueta="Carácter del viaje">
                    <Selector
                      value={form.caracter}
                      onChange={(v) => asignar('caracter', v)}
                      opciones={OPCIONES_CARACTER}
                    />
                  </Campo>

                  <Campo etiqueta="Duración de la expedición">
                    <div className="grid grid-cols-2 gap-2">
                      <Entrada
                        value={form.duracion_dias}
                        onChange={(v) => asignar('duracion_dias', v)}
                        placeholder="Días"
                        inputMode="numeric"
                      />
                      <Entrada
                        value={form.duracion_noches}
                        onChange={(v) => asignar('duracion_noches', v)}
                        placeholder="Noches"
                        inputMode="numeric"
                      />
                    </div>
                  </Campo>

                  <Campo etiqueta="Inversión referencial de autor">
                    <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                      <Entrada
                        value={form.precio_desde}
                        onChange={(v) => asignar('precio_desde', v)}
                        placeholder="6200.00"
                        inputMode="decimal"
                      />
                      <Selector
                        value={form.moneda}
                        onChange={(v) => asignar('moneda', v)}
                        opciones={MONEDAS}
                      />
                    </div>
                  </Campo>

                  <Campo etiqueta="Ventana estacional recomendada" className="md:col-span-2">
                    <Entrada
                      value={form.mejor_epoca}
                      onChange={(v) => asignar('mejor_epoca', v)}
                      placeholder="Ej. Marzo a mayo (sakura) · momiji en noviembre"
                    />
                  </Campo>

                  <div className="md:col-span-2">
                    <SubidorImagen
                      valor={form.imagen_principal}
                      publicId={form.imagen_public_id || null}
                      onChange={(url, publicId) => {
                        asignar('imagen_principal', url)
                        asignar('imagen_public_id', publicId ?? '')
                      }}
                      carpeta="destinos"
                      etiqueta="Imagen principal de la lámina"
                      ayuda="JPG, PNG, WEBP o AVIF. Se aloja en el almacén del proyecto y el enlace queda guardado en la ficha."
                    />
                  </div>

                  <Campo etiqueta="Titular editorial (lema)" className="md:col-span-2">
                    <Entrada
                      value={form.lema}
                      onChange={(v) => asignar('lema', v)}
                      placeholder="Una frase que abra el cuaderno"
                    />
                  </Campo>

                  <Campo etiqueta="Sinopsis corta (tarjetas del catálogo)" className="md:col-span-2">
                    <AreaTexto
                      value={form.resumen}
                      onChange={(v) => asignar('resumen', v)}
                      rows={2}
                      placeholder="Dos o tres líneas para el explorador y el mega-menú."
                    />
                  </Campo>

                  <Campo etiqueta="Sinopsis curatorial (ficha pública)" className="md:col-span-2">
                    <AreaTexto
                      value={form.descripcion}
                      onChange={(v) => asignar('descripcion', v)}
                      rows={4}
                      placeholder="Relato largo de la expedición…"
                    />
                  </Campo>
                </div>
              </Seccion>

              <Seccion titulo="Destino insignia de la portada" nota="Vitrina">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-outline-variant/50 bg-surface p-4">
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={(e) => asignar('destacado', e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#b85434]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-sans text-sm font-medium text-on-surface">
                      <IconoDestello className="h-4 w-4 text-terracotta" />
                      Mostrar con insignia de autor
                    </span>
                    <span className="mt-0.5 block font-sans text-xs text-on-surface-variant">
                      El enclave aparece en la portada, el mega-menú y encabeza el orden del atlas.
                    </span>
                  </span>
                </label>
              </Seccion>
            </>
          )}

          {pestana === 'itinerario' && (
            <Seccion
              titulo="Diario de ruta · hitos del itinerario"
              nota="Sección II · Bitácora"
              accion={
                <button
                  type="button"
                  onClick={() => setDias((d) => [...d, { titulo: '', descripcion: '', ubicacion: '' }])}
                  className="inline-flex items-center gap-1 rounded-md border border-outline-variant/60 px-3 py-1.5 coord text-secondary transition-colors hover:bg-surface-container"
                >
                  <IconoMas className="h-3.5 w-3.5" />
                  Añadir día
                </button>
              }
            >
              {dias.length === 0 ? (
                <p className="rounded-md border border-dashed border-outline-variant/60 px-4 py-10 text-center font-sans text-sm text-on-surface-variant">
                  Aún sin días de bitácora. Añada el primer hito del viaje.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {dias.map((dia, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 rounded-md border border-outline-variant/40 bg-surface p-4 transition-colors hover:border-primary/40 md:flex-row"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest font-sans text-xs font-semibold text-primary">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="grid flex-1 gap-3">
                        <Entrada
                          value={dia.titulo}
                          onChange={(v) => cambiarDia(setDias, i, 'titulo', v)}
                          placeholder="Titular del día · Ej. Ascenso a la ciudadela"
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Entrada
                            value={dia.ubicacion}
                            onChange={(v) => cambiarDia(setDias, i, 'ubicacion', v)}
                            placeholder="Ubicación · Ej. Aguas Calientes"
                          />
                          <Entrada
                            value={dia.descripcion}
                            onChange={(v) => cambiarDia(setDias, i, 'descripcion', v)}
                            placeholder="Nota del día"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDias((d) => d.filter((_, j) => j !== i))}
                        title="Quitar día"
                        className="self-start rounded-md p-1.5 text-stamp-sepia transition-colors hover:bg-error-container hover:text-error"
                      >
                        <IconoCerrar className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Seccion>
          )}

          {pestana === 'inclusiones' && (
            <Seccion titulo="Privilegios e inclusiones de la expedición" nota="Sección III · Contrato">
              <div className="grid gap-6 md:grid-cols-2">
                <ListaEditor
                  etiqueta="Incluye en la expedición"
                  tono="positivo"
                  valores={form.incluye}
                  onChange={(v) => asignar('incluye', v)}
                  placeholder="Ej. Traslados privados y guía historiador"
                />
                <ListaEditor
                  etiqueta="No incluye (transparencia)"
                  tono="neutro"
                  valores={form.no_incluye}
                  onChange={(v) => asignar('no_incluye', v)}
                  placeholder="Ej. Vuelos internacionales y gastos personales"
                />
              </div>
            </Seccion>
          )}

          {pestana === 'clasificacion' && (
            <Seccion titulo="Clasificación del recomendador" nota="Sección IV · Taxonomía">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="coord mb-2">Etiquetas del viaje</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESES.map((i) => {
                      const activa = form.etiquetas.includes(i.valor)
                      return (
                        <button
                          key={i.valor}
                          type="button"
                          aria-pressed={activa}
                          onClick={() =>
                            asignar(
                              'etiquetas',
                              activa
                                ? form.etiquetas.filter((e) => e !== i.valor)
                                : [...form.etiquetas, i.valor],
                            )
                          }
                          className={`rounded-full border px-3.5 py-1.5 font-sans text-xs transition-colors ${
                            activa
                              ? 'border-terracotta bg-terracotta text-white'
                              : 'border-parchment-border bg-surface-container-low text-on-surface-variant hover:border-terracotta/50 hover:text-primary'
                          }`}
                        >
                          {textoInteres(i.valor)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <ListaEditor
                  etiqueta="Etiquetas personalizadas"
                  tono="neutro"
                  valores={form.etiquetas.filter((e) => !INTERESES.some((i) => i.valor === e))}
                  onChange={(personalizadas) => {
                    const base = form.etiquetas.filter((e) => INTERESES.some((i) => i.valor === e))
                    asignar('etiquetas', [...base, ...personalizadas])
                  }}
                  placeholder="Ej. peregrinación, aves migratorias"
                />
              </div>
            </Seccion>
          )}
        </div>

        {/* ── Columna lateral (conservaduría y cartograma) ─────────────── */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          <div className="flex flex-col gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-paper">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <span className="coord flex items-center gap-1.5 text-secondary">
                <IconoSello className="h-3.5 w-3.5 text-terracotta" />
                Estado del enclave
              </span>
              <span className="coord">Control de publicación</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded border border-outline-variant/40 bg-surface-dim">
                {form.imagen_principal ? (
                  <img src={form.imagen_principal} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stamp-sepia/40">
                    <RosaVientos className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-tight text-on-surface">
                  {form.nombre || 'Enclave sin titular'}
                </h3>
                <p className="coord mt-0.5 truncate text-primary">
                  {form.region ? etiquetaRegion(form.region) : 'Sin región'} ·{' '}
                  {form.pais ? nombrePais(form.pais, form.pais_codigo) : 'Sin país'}
                </p>
              </div>
            </div>

            <dl className="flex flex-col gap-2 rounded-md bg-surface p-3">
              <FilaDato etiqueta="Slug público" valor={destinoId ? 'se genera automáticamente' : 'pendiente'} />
              <FilaDato
                etiqueta="Coordenadas"
                valor={coords ?? 'sin registrar'}
              />
              <FilaDato
                etiqueta="Duración"
                valor={form.duracion_dias ? `${form.duracion_dias} días / ${form.duracion_noches || 0} noches` : '—'}
              />
              <FilaDato etiqueta="Días de bitácora" valor={String(dias.filter((d) => d.titulo.trim()).length)} />
            </dl>

            {esAdmin(usuario?.rol) ? (
              <p className="coord leading-relaxed text-on-surface-variant">
                Como administrador puede publicar o retirar el enclave del catálogo público.
              </p>
            ) : (
              <p className="coord leading-relaxed text-on-surface-variant">
                Como agente puede editar la ficha; la publicación la confirma un administrador.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-paper">
            <span className="coord flex items-center gap-1.5 text-secondary">
              <IconoMapa className="h-3.5 w-3.5 text-primary" />
              Cartograma y referencia
            </span>
            <div className="rounded-md bg-surface p-3 font-sans text-xs text-on-surface-variant">
              {coords ?? 'Registre las coordenadas para situar el enclave en el mapa público.'}
            </div>
            {destinoId && (
              <Link
                to={`/destinos/${destinoId}`}
                className="inline-flex items-center gap-1.5 coord text-terracotta hover:text-primary"
              >
                Abrir ficha pública
                <IconoFlechaDerecha className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* ── Barra de cierre editorial ──────────────────────────────────── */}
      <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-lg border border-outline-variant/40 bg-surface-container-low p-5 md:flex-row">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              validacion.listos === validacion.items.length
                ? 'bg-secondary/10 text-secondary'
                : 'bg-terracotta/10 text-primary'
            }`}
          >
            <IconoSello className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg text-on-surface">
              Validación de criterio de selección
            </span>
            <span className="font-sans text-xs text-secondary">
              {validacion.listos} de {validacion.items.length} campos curados para auditoría editorial.
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {validacion.items.map((i) => (
            <span
              key={i.texto}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                i.ok ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${i.ok ? 'bg-secondary' : 'bg-stamp-sepia'}`} />
              {i.texto}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          to="/admin/destinos"
          className="inline-flex items-center gap-1.5 coord text-secondary hover:text-primary"
        >
          <IconoFlechaIzquierda className="h-3.5 w-3.5" />
          Volver al atlas
        </Link>
        <span className="coord">{destinoId ? registro(destinoId) : 'Nuevo ingreso al archivo'}</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Piezas                                                                     */
/* -------------------------------------------------------------------------- */

function mapearDestino(d: Destino): FormDestino {
  return {
    nombre: d.nombre,
    pais: d.pais,
    pais_codigo: d.pais_codigo ?? '',
    region: d.region ?? '',
    caracter: d.caracter ?? '',
    latitud: d.latitud ?? '',
    longitud: d.longitud ?? '',
    duracion_dias: d.duracion_dias != null ? String(d.duracion_dias) : '',
    duracion_noches: d.duracion_noches != null ? String(d.duracion_noches) : '',
    precio_desde: d.precio_desde ?? '',
    moneda: d.moneda || 'USD',
    mejor_epoca: d.mejor_epoca ?? '',
    imagen_principal: d.imagen_principal ?? '',
    imagen_public_id: d.imagen_public_id ?? '',
    resumen: d.resumen ?? '',
    lema: d.lema ?? '',
    descripcion: d.descripcion ?? '',
    destacado: d.destacado,
    activo: d.activo,
    incluye: d.incluye ?? [],
    no_incluye: d.no_incluye ?? [],
    etiquetas: d.etiquetas ?? [],
  }
}

function filaDe(i: ItinerarioDia): Fila {
  return {
    titulo: i.titulo,
    descripcion: i.descripcion ?? '',
    ubicacion: i.ubicacion ?? '',
  }
}

function cambiarDia(
  setDias: Dispatch<SetStateAction<Fila[]>>,
  indice: number,
  campo: keyof Fila,
  valor: string,
) {
  setDias((d) => d.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))
}

function SelloArchivo({ publicado }: { publicado: boolean }) {
  return (
    <div
      className={`hidden h-20 w-20 -rotate-6 select-none flex-col items-center justify-center rounded-full border p-1 xl:flex ${
        publicado ? 'border-primary/30' : 'border-outline-variant/60'
      }`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-primary/40 text-center">
        <span className="font-sans text-[7px] font-semibold uppercase tracking-widest text-primary">
          Illimani
        </span>
        <IconoSello className="h-3.5 w-3.5 text-primary" />
        <span className="font-sans text-[6px] uppercase tracking-wider text-secondary">
          {publicado ? 'Archivado' : 'Borrador'}
        </span>
      </div>
    </div>
  )
}

function Seccion({
  titulo,
  nota,
  accion,
  children,
}: {
  titulo: string
  nota: string
  accion?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-6 shadow-paper sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-on-surface">{titulo}</h2>
          <span className="coord">[{nota}]</span>
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

function Campo({
  etiqueta,
  requerido,
  ayuda,
  className = '',
  children,
}: {
  etiqueta: string
  requerido?: boolean
  ayuda?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="coord flex items-center gap-1">
        {etiqueta}
        {requerido && <span className="text-primary">*</span>}
      </span>
      {children}
      {ayuda && <span className="font-sans text-xs italic text-secondary">{ayuda}</span>}
    </label>
  )
}

function Entrada({
  value,
  onChange,
  placeholder,
  className = '',
  inputMode,
  maxLength,
}: {
  value: string
  onChange: (valor: string) => void
  placeholder?: string
  className?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  maxLength?: number
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      className={`w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary focus:bg-surface-container-lowest ${className}`}
    />
  )
}

function AreaTexto({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string
  onChange: (valor: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-none rounded-md border border-outline-variant/60 bg-surface p-3.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary"
    />
  )
}

function Selector({
  value,
  onChange,
  opciones,
}: {
  value: string
  onChange: (valor: string) => void
  opciones: { valor: string; texto: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors focus:border-primary"
    >
      {opciones.map((o) => (
        <option key={o.valor || 'vacio'} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  )
}

function ListaEditor({
  etiqueta,
  tono,
  valores,
  onChange,
  placeholder,
}: {
  etiqueta: string
  tono: 'positivo' | 'neutro'
  valores: string[]
  onChange: (valores: string[]) => void
  placeholder?: string
}) {
  const [borrador, setBorrador] = useState('')

  function agregar() {
    const limpio = borrador.trim()
    if (!limpio || valores.includes(limpio)) {
      setBorrador('')
      return
    }
    onChange([...valores, limpio])
    setBorrador('')
  }

  const estilo =
    tono === 'positivo'
      ? 'border-secondary/30 bg-secondary/10 text-secondary'
      : 'border-parchment-border bg-surface-container-low text-on-surface-variant'

  return (
    <div className="flex flex-col gap-3">
      <span className="coord">{etiqueta}</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/60 focus:border-primary"
        />
        <button
          type="button"
          onClick={agregar}
          className="shrink-0 rounded-md border border-outline-variant/60 px-3 text-primary transition-colors hover:bg-surface-container"
          title="Añadir"
        >
          <IconoMas className="h-4 w-4" />
        </button>
      </div>
      {valores.length === 0 ? (
        <p className="font-sans text-xs italic text-on-surface-variant">Sin registros todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {valores.map((v) => (
            <li
              key={v}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 font-sans text-sm ${estilo}`}
            >
              <span className="min-w-0 truncate">{v}</span>
              <button
                type="button"
                onClick={() => onChange(valores.filter((x) => x !== v))}
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                title="Quitar"
              >
                <IconoCerrar className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
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
