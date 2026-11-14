import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'

import { iaApi } from '@/api/ia'
import { MensajeItem } from '@/components/shared/ChatbotWidget/components/MensajeItem'
import {
  IconoChat,
  IconoEnviar,
  IconoFlechaDerecha,
  IconoRayo,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import type { MensajeChat } from '@/types/ia.types'
import { ROLES } from '@/utils/roles'
import { mensajeDeError } from '@/utils/validators'

const SALUDO =
  'Cuénteme qué viaje imagina: un destino, un tipo de experiencia, una época o un presupuesto. Yo le ayudo a darle forma.'

const SUGERENCIAS = [
  'Quiero una semana de playa en el Mediterráneo',
  'Busco un viaje cultural por Perú',
  '¿Qué paquete recomiendan para viajar con niños?',
  'Tengo 2.500 USD para una aventura en Sudamérica',
]

function crearId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function mensaje(emisor: MensajeChat['emisor'], texto: string): MensajeChat {
  return { id: crearId(), emisor, texto, creado_en: new Date().toISOString() }
}

export function DisenaTuViajeView() {
  const usuario = useAuthStore((s) => s.usuario)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    mensaje('agente', SALUDO),
  ])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversacionId = useRef<string | null>(null)
  const fin = useRef<HTMLDivElement>(null)

  const esCliente = usuario?.rol === ROLES.CLIENTE

  const enviar = async (mensajeTexto: string) => {
    const limpio = mensajeTexto.trim()
    if (!limpio || enviando) return

    setError(null)
    setMensajes((previos) => [...previos, mensaje('usuario', limpio)])
    setTexto('')
    setEnviando(true)

    try {
      const respuesta = await iaApi.chat(limpio, conversacionId.current)
      conversacionId.current = respuesta.conversacion_id
      setMensajes((previos) => [
        ...previos,
        mensaje('agente', respuesta.respuesta),
      ])
    } catch (e) {
      setError(mensajeDeError(e))
      setMensajes((previos) => [
        ...previos,
        mensaje(
          'agente',
          'No pude conectar con el asistente. Intente de nuevo en unos segundos.',
        ),
      ])
    } finally {
      setEnviando(false)
      requestAnimationFrame(() =>
        fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      )
    }
  }

  const alEnviar = (evento: FormEvent) => {
    evento.preventDefault()
    void enviar(texto)
  }

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      void enviar(texto)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="lg:sticky lg:top-28">
          <span className="coord inline-flex items-center gap-2 text-terracotta">
            <IconoRayo className="h-4 w-4" />
            Cuaderno de expediciones
          </span>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-on-surface sm:text-5xl">
            Diseña tu viaje
            <span className="block italic text-terracotta">a medida</span>
          </h1>
          <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-on-surface-variant">
            Nuestro asistente conoce el catálogo de Illimani y puede orientarle
            sobre destinos, paquetes, precios, requisitos y disponibilidad.
            Cuéntele su idea y afinamos la travesía juntos.
          </p>

          <div className="mt-7 space-y-2.5">
            {SUGERENCIAS.map((sugerencia) => (
              <button
                key={sugerencia}
                type="button"
                onClick={() => void enviar(sugerencia)}
                disabled={enviando}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-parchment-border bg-surface-container-lowest px-4 py-3 text-left font-sans text-sm text-on-surface shadow-paper transition-all hover:-translate-y-0.5 hover:border-terracotta/50 disabled:opacity-50"
              >
                {sugerencia}
                <IconoFlechaDerecha className="h-4 w-4 shrink-0 text-terracotta" />
              </button>
            ))}
          </div>

          {esCliente ? (
            <Link
              to="/mi-cuenta/recomendaciones"
              className="mt-6 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary underline decoration-terracotta/50 underline-offset-4"
            >
              Ver recomendaciones según mi perfil
              <IconoFlechaDerecha className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <p className="mt-6 font-sans text-xs text-on-surface-variant">
              ¿Ya es viajero?{' '}
              <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
                Inicie sesión
              </Link>{' '}
              para guardar su historial y recibir propuestas personalizadas.
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-parchment-border bg-surface-container-lowest shadow-paper">
          <header className="flex items-center gap-3 border-b border-white/10 bg-secondary px-5 py-4 text-on-secondary">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
              <IconoChat className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg leading-tight">Asistente Illimani</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-on-secondary-container">
                {enviando ? 'Escribiendo…' : 'En línea'}
              </p>
            </div>
          </header>

          <div className="h-[28rem] space-y-3 overflow-y-auto bg-surface px-4 py-5">
            {mensajes.map((item) => (
              <MensajeItem key={item.id} mensaje={item} />
            ))}
            {enviando && (
              <div role="status" className="flex justify-start">
                <div className="rounded-lg rounded-bl-sm border border-parchment-border/80 bg-surface-container-lowest px-3.5 py-2.5 shadow-sm">
                  <span className="animate-pulse font-sans text-sm text-on-surface-variant">
                    Consultando el cuaderno…
                  </span>
                </div>
              </div>
            )}
            <div ref={fin} />
          </div>

          <form onSubmit={alEnviar} className="border-t border-parchment-border p-3">
            {error && (
              <p className="mb-2 rounded-md border border-error/40 bg-error-container/50 px-3 py-2 font-sans text-xs text-on-error-container">
                {error}
              </p>
            )}
            <label className="sr-only" htmlFor="disena-mensaje">
              Escriba su consulta
            </label>
            <textarea
              id="disena-mensaje"
              rows={2}
              maxLength={500}
              value={texto}
              disabled={enviando}
              onChange={(evento) => setTexto(evento.target.value)}
              onKeyDown={alTeclear}
              placeholder="Ej. Quiero viajar a la playa en junio con un presupuesto de 2.000 USD..."
              className="w-full resize-none rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2.5 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/70 focus:border-terracotta disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-sans text-[10px] uppercase tracking-wider text-stamp-sepia">
                Enter envía · Shift+Enter salto de línea
              </span>
              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45"
              >
                <IconoEnviar className="h-4 w-4" />
                Enviar
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
