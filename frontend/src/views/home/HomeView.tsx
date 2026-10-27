import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { fadeInUp, staggerContainer } from '@/lib/motion'

/**
 * Landing pública (borrador de Fase 0).
 *
 * TODO(Fase 3): reconstruir fielmente según "BASE DISEÑO.png" de Stitch
 * (projects/11399679559610664478, screen 1653311392658988239) y su derivado
 * "LANDING PRINCIPAL", re-estilizando con los tokens locales de design.md.
 */
export function HomeView() {
  return (
    <section className="relative overflow-hidden bg-forest-night text-on-secondary">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div variants={fadeInUp}>
            <Badge color="dorado">Expediciones curadas · 2026</Badge>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="mt-6 text-5xl leading-[1.02] md:text-7xl">
            Viajes que cuentan
            <span className="italic text-gold"> historias</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-on-secondary-container"
          >
            Diseñamos travesías internacionales a medida: vuelos, hoteles y experiencias
            curadas por un tour operador que conoce cada rincón.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap gap-4">
            <Button tamano="lg">Explorar destinos →</Button>
            <Button variante="ghost" tamano="lg" className="border-white/30 text-on-secondary">
              Diseña tu viaje
            </Button>
          </motion.div>

          <motion.p variants={fadeInUp} className="nota-manuscrita mt-10 -rotate-2 text-gold">
            «Montañas que inspiran →»
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
