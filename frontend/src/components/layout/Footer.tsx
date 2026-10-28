import { Link } from 'react-router-dom'

import { RosaVientos } from '@/components/brand/RosaVientos'

/** Continentes en el orden editorial del catálogo, con su nombre legible. */
const REGIONES_FOOTER: Array<{ clave: string; nombre: string }> = [
  { clave: 'america_del_sur', nombre: 'América del Sur' },
  { clave: 'europa', nombre: 'Europa' },
  { clave: 'asia', nombre: 'Asia' },
  { clave: 'africa', nombre: 'África' },
]

const ENLACES_ATELIER = [
  { a: '/destinos', texto: 'Expediciones' },
  { a: '/#manifiesto', texto: 'Manifiesto' },
  { a: '/registro', texto: 'Solicitar cita privada' },
  { a: '/login', texto: 'Mi cuaderno de viaje' },
]

/**
 * Pie editorial de 4 columnas: identidad de la casa, cuadernos por región,
 * el atelier y el despacho central. Sustituye al pie mínimo del Sprint 1.
 */
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-secondary pb-12 pt-16 font-sans text-xs text-[#c9bfae]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* ── Retícula superior ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Identidad */}
          <div className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/50 bg-white/5 text-gold">
                <RosaVientos className="h-4 w-4" />
              </span>
              <span className="block font-display text-lg font-normal uppercase tracking-[0.25em] text-on-secondary">
                Illimani
              </span>
            </div>
            <p className="mb-5 max-w-sm font-display text-[13px] italic leading-relaxed text-on-secondary-container">
              Atelier de expediciones de autor: rutas curadas, estancias con historia propia y
              travesías diseñadas desde La Paz. Cada itinerario es un cuaderno de campo que
              escribimos contigo.
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gold/80">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Operador turístico · La Paz, Bolivia
            </div>
          </div>

          {/* Cuadernos de viaje */}
          <div className="lg:col-span-3">
            <h5 className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-on-secondary">
              Cuadernos de viaje
            </h5>
            <ul className="space-y-2.5 text-[12px]">
              {REGIONES_FOOTER.map((r) => (
                <li key={r.clave}>
                  <Link
                    to={`/destinos?region=${r.clave}`}
                    className="transition-colors hover:text-gold"
                  >
                    {r.nombre}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/destinos" className="transition-colors hover:text-gold">
                  Ver el atlas completo
                </Link>
              </li>
            </ul>
          </div>

          {/* El Atelier */}
          <div className="lg:col-span-2">
            <h5 className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-on-secondary">
              El atelier
            </h5>
            <ul className="space-y-2.5 text-[12px]">
              {ENLACES_ATELIER.map((e) => (
                <li key={e.a}>
                  <Link to={e.a} className="transition-colors hover:text-gold">
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Despacho central */}
          <div className="lg:col-span-3">
            <h5 className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-on-secondary">
              Despacho central
            </h5>
            <p className="mb-3 text-[12px] leading-relaxed text-on-secondary-container">
              Av. Arce, Zona Central
              <br />
              La Paz · Bolivia
            </p>
            <a
              href="mailto:contacto@illimanitravel.bo"
              className="mb-2 block font-mono text-[11px] text-gold/90 transition-colors hover:text-gold"
            >
              contacto@illimanitravel.bo
            </a>
            <span className="mb-3 block font-sans text-[11px] text-on-secondary-container">
              Lun a Vie · 09:00 – 18:00 (UTC−4)
            </span>
            <div className="flex items-center gap-3 pt-2">
              <span className="rounded border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wider">
                Slow travel
              </span>
              <span className="rounded border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wider">
                Turismo de autor
              </span>
            </div>
          </div>
        </div>

        {/* ── Barra inferior ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[11px] text-[#867b6d] sm:flex-row">
          <p>
            © {new Date().getFullYear()} Illimani Global Travel S.R.L. · La Paz, Bolivia. Todos los
            derechos reservados.
          </p>
          <p className="font-mono uppercase tracking-widest">
            Taller de Proyecto · UMSA 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
