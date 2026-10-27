import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

/** 7. Panel · Inicio (esqueleto) → /admin */
export function DashboardView() {
  const usuario = useAuthStore((s) => s.usuario)
  const [cifras, setCifras] = useState({ equipo: 0, eventos: 0 })

  useEffect(() => {
    let activo = true
    Promise.all([authApi.usuarios(), authApi.auditoria()])
      .then(([equipo, auditoria]) => {
        if (activo) setCifras({ equipo: equipo.count, eventos: auditoria.count })
      })
      .catch(() => undefined)
    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="etiqueta-seccion">Panel de administración</p>
        <h1 className="mt-3 font-display text-4xl text-on-surface">
          Buen día, {usuario?.email.split('@')[0] ?? 'expedicionario'}
        </h1>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Resumen operativo de Illimani Global Travel.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaCifra etiqueta="Miembros del equipo" valor={cifras.equipo} nota="cuentas internas" />
        <TarjetaCifra etiqueta="Eventos de seguridad" valor={cifras.eventos} nota="en la bitácora" />
        <TarjetaCifra etiqueta="Destinos activos" valor="—" nota="se habilita en CU3" />
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Acceso
          titulo="Equipo y accesos"
          descripcion="Altas, roles y estado de las cuentas internas."
          a="/admin/roles"
        />
        <Acceso
          titulo="Bitácora de seguridad"
          descripcion="Accesos, intentos fallidos y cambios registrados."
          a="/admin/auditoria"
        />
      </section>
    </div>
  )
}

function TarjetaCifra({
  etiqueta,
  valor,
  nota,
}: {
  etiqueta: string
  valor: string | number
  nota: string
}) {
  return (
    <div className="rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper">
      <p className="etiqueta-seccion">{etiqueta}</p>
      <p className="mt-3 font-display text-5xl text-primary">{valor}</p>
      <p className="mt-1 font-sans text-xs text-on-surface-variant">{nota}</p>
    </div>
  )
}

function Acceso({ titulo, descripcion, a }: { titulo: string; descripcion: string; a: string }) {
  return (
    <Link
      to={a}
      className="group rounded-lg border border-parchment-border bg-surface-container-low p-6 transition-colors hover:border-terracotta/50 hover:bg-surface-container"
    >
      <h2 className="font-display text-2xl text-on-surface group-hover:text-primary">{titulo}</h2>
      <p className="mt-2 font-sans text-sm text-on-surface-variant">{descripcion}</p>
      <span className="mt-4 inline-block font-sans text-xs uppercase tracking-wider text-primary">
        Abrir sección →
      </span>
    </Link>
  )
}