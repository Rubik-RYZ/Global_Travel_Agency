import { IconoChat, IconoMas } from '@/components/ui/Iconos'
import type { ConversacionChat } from '@/types/ia.types'

interface HistorialChatsProps {
  conversaciones: ConversacionChat[]
  activaId: string
  onSeleccionar: (id: string) => void
  onNuevo: () => void
}

function titulo(conversacion: ConversacionChat): string {
  const primero = conversacion.mensajes.find((mensaje) => mensaje.emisor === 'usuario')
  if (!primero) return 'Nueva conversación'
  return primero.texto.length > 46 ? `${primero.texto.slice(0, 46)}…` : primero.texto
}

function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function HistorialChats({
  conversaciones,
  activaId,
  onSeleccionar,
  onNuevo,
}: HistorialChatsProps) {
  const ordenadas = [...conversaciones].sort(
    (a, b) => new Date(b.actualizada_en).getTime() - new Date(a.actualizada_en).getTime(),
  )

  return (
    <div className="flex-1 overflow-y-auto bg-surface px-4 py-5">
      <button
        type="button"
        onClick={onNuevo}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-md border border-terracotta/40 bg-terracotta/10 px-4 py-3 font-sans text-sm font-medium text-primary transition-colors hover:bg-terracotta/15"
      >
        <IconoMas className="h-4 w-4" />
        Nuevo chat
      </button>

      <p className="coord">Conversaciones anteriores</p>

      <ul className="mt-3 space-y-2">
        {ordenadas.map((conversacion) => {
          const ultimo = conversacion.mensajes[conversacion.mensajes.length - 1]
          const activa = conversacion.id === activaId

          return (
            <li key={conversacion.id}>
              <button
                type="button"
                onClick={() => onSeleccionar(conversacion.id)}
                className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  activa
                    ? 'border-terracotta/60 bg-surface-container-low'
                    : 'border-parchment-border bg-surface-container-lowest hover:border-terracotta/40'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activa ? 'bg-terracotta text-white' : 'bg-surface-container text-terracotta'
                  }`}
                >
                  <IconoChat className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-sm font-medium text-on-surface">
                    {titulo(conversacion)}
                  </span>
                  <span className="mt-0.5 block truncate font-sans text-xs text-on-surface-variant">
                    {ultimo?.texto ?? 'Sin mensajes'}
                  </span>
                  <span className="mt-1 block font-sans text-[10px] uppercase tracking-wider text-stamp-sepia">
                    {fecha(conversacion.actualizada_en)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
