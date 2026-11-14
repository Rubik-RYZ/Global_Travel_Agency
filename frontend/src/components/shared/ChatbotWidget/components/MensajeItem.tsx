import type { MensajeChat } from '@/types/ia.types'

function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function MensajeItem({ mensaje }: { mensaje: MensajeChat }) {
  const esUsuario = mensaje.emisor === 'usuario'

  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 shadow-sm ${
          esUsuario
            ? 'rounded-br-sm bg-terracotta text-white'
            : 'rounded-bl-sm border border-parchment-border/80 bg-surface-container-lowest text-on-surface'
        }`}
      >
        <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{mensaje.texto}</p>
        <p
          className={`mt-1 text-right font-sans text-[10px] ${
            esUsuario ? 'text-white/70' : 'text-stamp-sepia'
          }`}
        >
          {hora(mensaje.creado_en)}
        </p>
      </div>
    </div>
  )
}
