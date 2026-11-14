import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { IconoEnviar, IconoReloj } from '@/components/ui/Iconos'

interface InputChatProps {
  enviando: boolean
  onEnviar: (texto: string) => void
  onHistorial: () => void
}

export function InputChat({ enviando, onEnviar, onHistorial }: InputChatProps) {
  const [texto, setTexto] = useState('')

  const enviar = () => {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    onEnviar(limpio)
    setTexto('')
  }

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      enviar()
    }
  }

  return (
    <div className="border-t border-parchment-border bg-surface-bright p-3">
      <label className="sr-only" htmlFor="chat-mensaje">
        Escribe tu mensaje
      </label>
      <textarea
        id="chat-mensaje"
        autoFocus
        rows={2}
        maxLength={500}
        value={texto}
        disabled={enviando}
        onChange={(evento) => setTexto(evento.target.value)}
        onKeyDown={alTeclear}
        placeholder="Escribe tu consulta de viaje..."
        className="w-full resize-none rounded-md border border-parchment-border bg-surface-container-lowest px-3 py-2 font-sans text-sm text-on-surface outline-none transition-colors placeholder:text-stamp-sepia/70 focus:border-terracotta disabled:opacity-60"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onHistorial}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-outline-variant px-3 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container"
        >
          <IconoReloj className="h-4 w-4" />
          Historial
        </button>
        <button
          type="button"
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-terracotta px-3 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-white transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45"
        >
          <IconoEnviar className="h-4 w-4" />
          {enviando ? 'Enviando' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
