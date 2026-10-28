import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { authApi } from '@/api/auth'
import { clientesApi } from '@/api/clientes'
import { RosaVientos } from '@/components/brand/RosaVientos'
import {
  IconoEscudo,
  IconoFlechaDerecha,
  IconoMaletin,
  IconoPersona,
  IconoPortapapeles,
  IconoSello,
  IconoUbicacion,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import { etiquetaRol } from '@/utils/roles'

interface ModuloAcceso {
  titulo: string
  descripcion: string
  a: string
  icono: ReactNode
}

const ACCESOS: ModuloAcceso[] = [
  {
    titulo: 'Directorio de viajeros',
    descripcion: 'Padrón de clientes, fichas y preferencias de cada expedicionario.',
    a: '/admin/clientes',
    icono: <IconoPersona className="h-5 w-5" />,
  },
  {
    titulo: 'Equipo y accesos',
    descripcion: 'Gabinete de custodios, jerarquías de acceso y credenciales internas.',
    a: '/admin/roles',
    icono: <IconoEscudo className="h-5 w-5" />,
  },
  {
    titulo: 'Bitácora de seguridad',
    descripcion: 'Libro de actas: accesos, intentos fallidos y cambios sellados.',
    a: '/admin/auditoria',
    icono: <IconoPortapapeles className="h-5 w-5" />,
  },
  {
    titulo: 'Destinos & expediciones',
    descripcion: 'Atlas de rutas, itinerarios día a día y láminas del catálogo.',
    a: '/admin/destinos',
    icono: <IconoUbicacion className="h-5 w-5" />,
  },
  {
    titulo: 'Proveedores',
    descripcion: 'Aerolíneas, hospedajes y operadores de la red de confianza.',
    a: '/admin/proveedores',
    icono: <IconoMaletin className="h-5 w-5" />,
  },
]

/** 7. Panel · Inicio → /admin */
export function DashboardView() {
  const usuario = useAuthStore((s) => s.usuario)
  const [cifras, setCifras] = useState({ equipo: 0, eventos: 0, viajeros: 0 })

  useEffect(() => {
    let activo = true
    Promise.all([authApi.usuarios(), authApi.auditoria(), clientesApi.listar()])
      .then(([equipo, auditoria, clientes]) => {
        if (activo)
          setCifras({ equipo: equipo.count, eventos: auditoria.count, viajeros: clientes.count })
      })
      .catch(() => undefined)
    return () => { activo = false }
  }, [])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const rol = etiquetaRol(usuario?.rol as 'administrador' | 'agente' | 'cliente' | null)

  return (
    <div className="mx-auto max-w-6xl">

      {/* ── Hero editorial ────────────────────────────────────────────── */}
      <section className="relative mb-10 overflow-hidden rounded-lg border border-secondary/40 bg-secondary shadow-paper-lg">
        <div aria-hidden className="textura-carta pointer-events-none absolute inset-0 opacity-[0.04]" />

        {/* Rosa de vientos marca de agua */}
        <div aria-hidden className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 opacity-[0.06]">
          <RosaVientos className="h-80 w-80 text-gold" />
        </div>

        {/* Cinta superior */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-6 py-2.5 sm:px-10">
          <span className="coord text-gold">Registro de Ruta · Sprint II</span>
          <span className="coord hidden text-on-secondary-container sm:inline">
            16°30′ S · 68°09′ W · La Paz, Bolivia
          </span>
          <span className="coord text-on-secondary-container">Estado: vigilancia activa</span>
        </div>

        {/* Cuerpo */}
        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="coord text-gold">Códice administrativo · {rol}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-on-secondary sm:text-5xl">
              {saludo},
              <br />
              <em className="text-gold not-italic">{usuario?.email.split('@')[0] ?? 'expedicionario'}</em>
            </h1>
            <p className="mt-5 max-w-lg font-sans text-sm leading-relaxed text-on-secondary-container">
              Gabinete editorial de Illimani Global Travel. Consulte los módulos
              desde el selector o acceda directamente a las secciones más frecuentes.
            </p>
          </div>

          {/* Métricas laterales */}
          <div className="grid gap-3 self-center sm:grid-cols-3 lg:grid-cols-1 lg:gap-4">
            <MetricaHero valor={cifras.viajeros} etiqueta="Viajeros" sub="en el padrón" />
            <MetricaHero valor={cifras.equipo} etiqueta="Custodios" sub="en servicio" />
            <MetricaHero valor={cifras.eventos} etiqueta="Actas" sub="en la bitácora" />
          </div>
        </div>

        {/* Sello decorativo */}
        <div className="flex items-center gap-3 border-t border-white/10 px-6 py-3 sm:px-10">
          <IconoSello className="h-3.5 w-3.5 text-gold" />
          <span className="coord text-gold">Illimani Global Travel S.R.L. · Panel oficial</span>
        </div>
      </section>

      {/* ── Accesos rápidos ───────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-3">
        <span className="regla-terracota" />
        <p className="etiqueta-seccion">Módulos disponibles</p>
        <span aria-hidden className="h-px flex-1 bg-parchment-border" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCESOS.map((m) => (
          <Link
            key={m.a}
            to={m.a}
            className="group flex flex-col gap-4 rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper transition-all hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-paper-lg"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-white">
              {m.icono}
            </span>
            <div className="flex-1">
              <p className="font-display text-xl text-on-surface group-hover:text-primary">{m.titulo}</p>
              <p className="mt-1 font-sans text-sm leading-relaxed text-on-surface-variant">{m.descripcion}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary">
              Abrir módulo
              <IconoFlechaDerecha className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function MetricaHero({ valor, etiqueta, sub }: { valor: number; etiqueta: string; sub: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-center">
      <p className="font-display text-3xl leading-none text-gold">{valor}</p>
      <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-on-secondary">
        {etiqueta}
      </p>
      <p className="font-sans text-[10px] text-on-secondary-container">{sub}</p>
    </div>
  )
}
