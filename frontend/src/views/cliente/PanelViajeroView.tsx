import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { perfilApi } from '@/api/clientes'
import { RosaVientos } from '@/components/brand/RosaVientos'
import { Monograma } from '@/components/shared/Monograma'
import { Badge } from '@/components/ui/Badge/Badge'
import {
  IconoCalendario,
  IconoCorazon,
  IconoDocumento,
  IconoFlechaDerecha,
  IconoEtiqueta,
  IconoLapiz,
  IconoPasaporte,
  IconoTelefono,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import type { ClientePreferencia, PerfilViajero } from '@/types/clientes.types'
import { textoDocumento, textoInteres } from '@/utils/catalogos'
import { formatearFecha, formatearMoneda } from '@/utils/formatters'
import { mensajeDeError } from '@/utils/validators'
import { DocumentosViajeroForm } from '@/views/cliente/components/DocumentosViajeroForm'

/** 10. Mi viaje · Resumen → /mi-cuenta */
export function PanelViajeroView() {
  const [perfil, setPerfil] = useState<PerfilViajero | null>(null)
  const [preferencias, setPreferencias] = useState<ClientePreferencia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [p, pref] = await Promise.all([perfilApi.obtener(), perfilApi.preferencias()])
      setPerfil(p)
      setPreferencias(pref)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (cargando) {
    return <p className="nota-manuscrita text-stamp-sepia">Abriendo su cuaderno de bitácora...</p>
  }

  if (error || !perfil || !preferencias) {
    return (
      <p className="rounded-md border border-error/40 bg-error-container/50 px-4 py-2.5 font-sans text-xs text-on-error-container">
        {error ?? 'No se pudo cargar su perfil.'}
      </p>
    )
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Retícula cartográfica de fondo, muy tenue */}
      <div aria-hidden className="textura-carta pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <BannerCredencial perfil={perfil} preferencias={preferencias} />
      <ProximaExpedicion />

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FichaViajero perfil={perfil} />
        </div>
        <div className="lg:col-span-5">
          <NotasCabina preferencias={preferencias} />
        </div>
      </div>

      <CredencialesViajero perfil={perfil} onGuardado={cargar} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 1. Banner de credencial (pasaporte)                                        */
/* -------------------------------------------------------------------------- */

function BannerCredencial({
  perfil,
  preferencias,
}: {
  perfil: PerfilViajero
  preferencias: ClientePreferencia
}) {
  const primerNombre = perfil.nombres.split(' ')[0]
  const expediente = `N.º ${String(perfil.id).padStart(5, '0')}`
  const completos = [
    perfil.documento_tipo && perfil.documento_numero,
    perfil.telefono,
    perfil.fecha_nacimiento,
    perfil.pais_origen,
  ].filter(Boolean).length
  const anio = new Date(perfil.creado_en).getFullYear()

  return (
    <header className="flex flex-col gap-6 border-b border-parchment-border pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
            Bitácora activa
          </span>
          <span className="coord">
            Pasaporte del viajero · {expediente}
            {perfil.pais_origen ? ` · ${perfil.pais_origen}` : ''}
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl leading-[1.05] text-on-surface sm:text-5xl">
          Bienvenido de nuevo,{' '}
          <span className="italic text-terracotta">{primerNombre}</span>
        </h1>

        <p className="mt-3 max-w-xl font-display text-lg italic leading-relaxed text-stamp-sepia">
          {completos === 4
            ? 'Su ficha está completa; solo falta elegir el próximo destino.'
            : 'Complete su ficha de viajero para que preparemos cada travesía a su medida.'}
        </p>
      </div>

      <dl className="flex items-stretch gap-5 rounded-lg border border-parchment-border bg-surface-container-lowest px-6 py-4 shadow-paper">
        <Metrica etiqueta="Ficha" valor={`${completos}/4`} />
        <span className="w-px self-stretch bg-parchment-border" />
        <Metrica
          etiqueta="Intereses"
          valor={String(preferencias.intereses.length).padStart(2, '0')}
          acento
        />
        <span className="w-px self-stretch bg-parchment-border" />
        <Metrica etiqueta="Miembro desde" valor={String(anio)} />
      </dl>
    </header>
  )
}

function Metrica({
  etiqueta,
  valor,
  acento = false,
}: {
  etiqueta: string
  valor: string
  acento?: boolean
}) {
  return (
    <div className="flex flex-col">
      <dt className="coord">{etiqueta}</dt>
      <dd
        className={`mt-1 font-display text-2xl leading-none ${acento ? 'text-terracotta' : 'text-on-surface'}`}
      >
        {valor}
      </dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 2. Próxima expedición (aún sin reservas)                                   */
/* -------------------------------------------------------------------------- */

function ProximaExpedicion() {
  return (
    <section className="relative mt-8 overflow-hidden rounded-lg border border-secondary/30 bg-secondary text-on-secondary shadow-paper-lg">
      <div aria-hidden className="textura-carta pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 opacity-10"
      >
        <RosaVientos className="h-72 w-72 text-gold" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-white/10 px-6 py-3 sm:px-8">
        <span className="coord text-gold">Dossier de viaje</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="coord text-on-secondary-container">Estado · en preparación</span>
          <span className="coord text-on-secondary-container">Curaduría · La Paz</span>
        </div>
      </div>

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <figure className="overflow-hidden rounded-md border border-gold/25 bg-white/[0.03]">
            <div className="flex aspect-[16/10] items-center justify-center lg:aspect-[4/3]">
              <RosaVientos className="h-24 w-24 text-gold/80 lg:h-28 lg:w-28" />
            </div>
            <figcaption className="flex items-center justify-between gap-2 border-t border-gold/20 px-3 py-2">
              <span className="coord text-gold/80">Lámina I</span>
              <span className="coord text-on-secondary-container">16°30′ S · 68°09′ W</span>
            </figcaption>
          </figure>
        </div>

        <div className="lg:col-span-8">
          <span className="coord text-gold">Próxima expedición</span>
          <h2 className="mt-2 font-display text-3xl leading-tight text-on-secondary">
            Todavía no hay rutas reservadas
          </h2>
          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-on-secondary-container">
            Cuando reserve su primer viaje, aquí aparecerá su dossier completo:
            itinerario, vuelos, hospedaje y la bitácora de cada jornada. Por ahora,
            vamos afinando su perfil de viajero.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/mi-cuenta/preferencias"
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-wider text-white shadow-paper transition-transform hover:-translate-y-0.5"
            >
              Afinar mi brújula
              <IconoFlechaDerecha className="h-4 w-4" />
            </Link>
            <span className="font-hand text-lg text-gold">el mundo espera ✦</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 3a. Ficha del viajero (datos personales, solo lectura)                     */
/* -------------------------------------------------------------------------- */

function FichaViajero({ perfil }: { perfil: PerfilViajero }) {
  const foto = useAuthStore((s) => s.usuario?.foto_url)
  return (
    <section className="relative h-full overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.05]">
        <RosaVientos className="h-52 w-52 text-primary" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconoDocumento className="h-4 w-4 text-terracotta" />
            <p className="etiqueta-seccion text-primary">Ficha del viajero</p>
          </div>
          <h2 className="mt-2 font-display text-2xl text-on-surface">Datos personales</h2>
        </div>
        <Link
          to="/mi-cuenta/preferencias"
          className="inline-flex shrink-0 items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:text-terracotta"
        >
          <IconoLapiz className="h-3.5 w-3.5" />
          Editar
        </Link>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-parchment-border/70 py-5">
        <Monograma nombre={perfil.nombre_completo} tamano="md" foto={foto} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-tight text-on-surface">
            {perfil.nombre_completo}
          </p>
          <p className="truncate font-sans text-sm text-on-surface-variant">{perfil.email}</p>
        </div>
        <span className="w-full whitespace-nowrap sm:ml-auto sm:w-auto">
          <Badge color="dorado">{textoDocumento(perfil.documento_tipo)}</Badge>
        </span>
      </div>

      <dl className="relative mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Dato
          icono={<IconoDocumento className="h-4 w-4" />}
          etiqueta="Documento"
          valor={perfil.documento_numero ?? 'Sin registrar'}
        />
        <Dato
          icono={<IconoTelefono className="h-4 w-4" />}
          etiqueta="Teléfono"
          valor={perfil.telefono ?? 'Sin registrar'}
        />
        <Dato
          icono={<IconoCalendario className="h-4 w-4" />}
          etiqueta="Fecha de nacimiento"
          valor={
            perfil.fecha_nacimiento ? formatearFecha(perfil.fecha_nacimiento) : 'Sin registrar'
          }
        />
        <Dato
          icono={<IconoUbicacion className="h-4 w-4" />}
          etiqueta="País de origen"
          valor={perfil.pais_origen ?? 'Sin registrar'}
        />
      </dl>
    </section>
  )
}

function Dato({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode
  etiqueta: string
  valor: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-stamp-sepia">
        {icono}
      </span>
      <div className="min-w-0">
        <dt className="coord">{etiqueta}</dt>
        <dd className="mt-0.5 font-sans text-sm text-on-surface">{valor}</dd>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 3b. Notas de cabina y preferencias                                         */
/* -------------------------------------------------------------------------- */

function NotasCabina({ preferencias }: { preferencias: ClientePreferencia }) {
  const tieneIntereses = preferencias.intereses.length > 0

  return (
    <section className="flex h-full flex-col rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper sm:p-8">
      <div className="flex items-center gap-2">
        <IconoCorazon className="h-4 w-4 text-terracotta" />
        <p className="etiqueta-seccion text-primary">Perfil del viajero</p>
      </div>
      <h2 className="mt-2 font-display text-2xl text-on-surface">
        Notas de cabina &amp; preferencias
      </h2>

      <div className="mt-6 flex items-end justify-between gap-4 border-b border-parchment-border/70 pb-4">
        <div>
          <p className="coord">Presupuesto por viaje</p>
          <p className="mt-1 font-display text-3xl text-on-surface">
            {preferencias.presupuesto_max
              ? formatearMoneda(preferencias.presupuesto_max, preferencias.moneda)
              : 'A convenir'}
          </p>
        </div>
        <span className="rounded-full border border-parchment-border px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {preferencias.moneda}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <IconoEtiqueta className="h-3.5 w-3.5" />
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider">Intereses</p>
        </div>
        {tieneIntereses ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {preferencias.intereses.map((i) => (
              <li
                key={i}
                className="rounded-full border border-terracotta/30 bg-terracotta/10 px-3 py-1 font-sans text-[11px] uppercase tracking-wider text-primary"
              >
                {textoInteres(i)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-sans text-sm text-on-surface-variant">
            Aún no ha marcado intereses.
          </p>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Link
          to="/mi-cuenta/preferencias"
          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:text-terracotta"
        >
          Modificar mis preferencias
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 4. Credenciales de viaje (retrato + documentos digitalizados)              */
/* -------------------------------------------------------------------------- */

function CredencialesViajero({
  perfil,
  onGuardado,
}: {
  perfil: PerfilViajero
  onGuardado: () => void
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="regla-terracota" />
        <p className="etiqueta-seccion">Credenciales de viaje</p>
        <span aria-hidden className="h-px flex-1 bg-parchment-border" />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
        <header className="flex items-start gap-3 border-b border-parchment-border/70 bg-surface-container-low px-6 py-5 sm:px-8">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-primary">
            <IconoPasaporte className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-2xl leading-tight text-on-surface">
              Su retrato y documentos
            </h2>
            <p className="mt-1 font-sans text-sm italic text-on-surface-variant">
              Súbalos una sola vez: los usaremos en cada reserva y en cada embarque.
            </p>
          </div>
        </header>
        <div className="px-6 py-6 sm:px-8">
          <DocumentosViajeroForm perfil={perfil} onGuardado={onGuardado} />
        </div>
      </div>
    </section>
  )
}
