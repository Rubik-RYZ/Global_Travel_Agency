import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { iaApi } from '@/api/ia'
import { HistorialChats } from '@/components/shared/ChatbotWidget/components/HistorialChats'
import { InputChat } from '@/components/shared/ChatbotWidget/components/InputChat'
import { MensajeItem } from '@/components/shared/ChatbotWidget/components/MensajeItem'
import {
  IconoChat,
  IconoCerrar,
  IconoFlechaIzquierda,
} from '@/components/ui/Iconos'
import { useAuthStore } from '@/store/authStore'
import type { ConversacionChat, MensajeChat } from '@/types/ia.types'

const CLAVE_ALMACEN = 'illimani-chat'
const SALUDO =
  'Hola, soy el asistente de Illimani. Puedo ayudarte con paquetes, destinos, precios y disponibilidad. ¿Qué viaje estás pensando?'

interface EstadoChat {
  conversaciones: ConversacionChat[]
  activaId: string
}

function crearId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function crearMensaje(
  emisor: MensajeChat['emisor'],
  texto: string,
  creadoEn = new Date().toISOString(),
): MensajeChat {
  return {
    id: crearId(),
    emisor,
    texto,
    creado_en: creadoEn,
  }
}

function crearConversacion(): ConversacionChat {
  const ahora = new Date().toISOString()
  return {
    id: crearId(),
    mensajes: [crearMensaje('agente', SALUDO, ahora)],
    creada_en: ahora,
    actualizada_en: ahora,
  }
}

function estadoInicial(): EstadoChat {
  const conversacion = crearConversacion()
  return {
    conversaciones: [conversacion],
    activaId: conversacion.id,
  }
}

function leerEstado(): EstadoChat {
  try {
    const crudo = window.localStorage.getItem(CLAVE_ALMACEN)
    if (!crudo) return estadoInicial()

    const guardado = JSON.parse(crudo) as Partial<EstadoChat>
    if (!Array.isArray(guardado.conversaciones) || guardado.conversaciones.length === 0) {
      return estadoInicial()
    }

    const conversaciones = guardado.conversaciones
    const activaId =
      typeof guardado.activaId === 'string' &&
      conversaciones.some((conversacion) => conversacion.id === guardado.activaId)
        ? guardado.activaId
        : conversaciones[0].id

    return { conversaciones, activaId }
  } catch {
    return estadoInicial()
  }
}

function guardarEstado(estado: EstadoChat): void {
  try {
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado))
  } catch {
    return
  }
}

function fusionarHistorial(
  previo: EstadoChat,
  servidor: ConversacionChat[],
): EstadoChat {
  const locales = previo.conversaciones.filter(
    (conversacion) =>
      !conversacion.servidorId &&
      conversacion.mensajes.some((mensaje) => mensaje.emisor === 'usuario'),
  )
  const conversaciones = [...servidor, ...locales]

  if (conversaciones.length === 0) {
    const nueva = crearConversacion()
    return { conversaciones: [nueva], activaId: nueva.id }
  }

  const activaId = conversaciones.some(
    (conversacion) => conversacion.id === previo.activaId,
  )
    ? previo.activaId
    : conversaciones[0].id

  return { conversaciones, activaId }
}

export function ChatbotWidget() {
  const usuario = useAuthStore((s) => s.usuario)
  const [abierto, setAbierto] = useState(false)
  const [verHistorial, setVerHistorial] = useState(false)
  const [estado, setEstado] = useState<EstadoChat>(leerEstado)
  const [enviandoEn, setEnviandoEn] = useState<string | null>(null)
  const historialCargado = useRef<number | null>(null)
  const finMensajes = useRef<HTMLDivElement>(null)

  const activa =
    estado.conversaciones.find((conversacion) => conversacion.id === estado.activaId) ??
    estado.conversaciones[0]
  const enviando = enviandoEn !== null

  useEffect(() => {
    guardarEstado(estado)
  }, [estado])

  useEffect(() => {
    const usuarioId = usuario?.id ?? null
    if (!usuarioId) {
      historialCargado.current = null
      return
    }
    if (historialCargado.current === usuarioId) return

    historialCargado.current = usuarioId
    let cancelado = false

    iaApi
      .historial()
      .then((servidor) => {
        if (!cancelado) {
          setEstado((previo) => fusionarHistorial(previo, servidor))
        }
      })
      .catch(() => {
        historialCargado.current = null
      })

    return () => {
      cancelado = true
    }
  }, [usuario?.id])

  useEffect(() => {
    if (!abierto) return

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', alTeclear)

    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto || verHistorial) return
    finMensajes.current?.scrollIntoView({ behavior: 'smooth' })
  }, [abierto, verHistorial, activa.mensajes.length, enviandoEn])

  const nuevaConversacion = () => {
    const conversacion = crearConversacion()
    setEstado((previo) => ({
      conversaciones: [conversacion, ...previo.conversaciones],
      activaId: conversacion.id,
    }))
    setVerHistorial(false)
  }

  const seleccionarConversacion = (id: string) => {
    setEstado((previo) => ({ ...previo, activaId: id }))
    setVerHistorial(false)
  }

  const agregarMensaje = (mensaje: MensajeChat, conversacionId: string) => {
    setEstado((previo) => {
      const actual =
        previo.conversaciones.find((conversacion) => conversacion.id === conversacionId) ??
        previo.conversaciones.find((conversacion) => conversacion.id === previo.activaId) ??
        crearConversacion()

      const actualizada: ConversacionChat = {
        ...actual,
        mensajes: [...actual.mensajes, mensaje],
        actualizada_en: mensaje.creado_en,
      }

      return {
        activaId: previo.activaId === conversacionId ? actualizada.id : previo.activaId,
        conversaciones: [
          actualizada,
          ...previo.conversaciones.filter((conversacion) => conversacion.id !== actualizada.id),
        ],
      }
    })
  }

  const vincularServidor = (conversacionLocalId: string, servidorId: string) => {
    setEstado((previo) => ({
      ...previo,
      conversaciones: previo.conversaciones.map((conversacion) =>
        conversacion.id === conversacionLocalId
          ? { ...conversacion, servidorId, persistida: true }
          : conversacion,
      ),
    }))
  }

  const enviarMensaje = async (texto: string) => {
    const conversacionId = activa.id
    const ahora = new Date().toISOString()

    agregarMensaje(crearMensaje('usuario', texto, ahora), conversacionId)
    setEnviandoEn(conversacionId)

    try {
      const { respuesta, conversacion_id } = await iaApi.chat(
        texto,
        activa.servidorId,
      )
      if (conversacion_id) {
        vincularServidor(conversacionId, conversacion_id)
      }
      agregarMensaje(crearMensaje('agente', respuesta), conversacionId)
    } catch {
      agregarMensaje(
        crearMensaje(
          'agente',
          'No pude conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.',
        ),
        conversacionId,
      )
    } finally {
      setEnviandoEn((actual) => (actual === conversacionId ? null : actual))
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir asistente de viaje"
        title="Asistente de viaje"
        onClick={() => setAbierto(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-white shadow-paper-lg transition-all duration-200 hover:-translate-y-1 hover:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta sm:bottom-7 sm:right-7"
      >
        <IconoChat className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {abierto && (
          <>
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAbierto(false)}
              className="fixed inset-0 z-[60] bg-inverse-surface/25 backdrop-blur-[2px]"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Asistente de viaje Illimani"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[27rem] flex-col border-l border-parchment-border bg-surface-bright shadow-paper-lg"
            >
              <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-secondary px-4 py-3 text-on-secondary">
                <div className="flex min-w-0 items-center gap-2.5">
                  {verHistorial ? (
                    <button
                      type="button"
                      aria-label="Volver al chat"
                      onClick={() => setVerHistorial(false)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-secondary transition-colors hover:bg-white/10"
                    >
                      <IconoFlechaIzquierda className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                      <IconoChat className="h-5 w-5" />
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight">
                      {verHistorial ? 'Historial de chats' : 'Asistente Illimani'}
                    </p>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-on-secondary-container">
                      {verHistorial ? 'Tus conversaciones' : 'Chat de viajes'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar asistente"
                  onClick={() => setAbierto(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-secondary transition-colors hover:bg-white/10"
                >
                  <IconoCerrar className="h-5 w-5" />
                </button>
              </header>

              {verHistorial ? (
                <HistorialChats
                  conversaciones={estado.conversaciones}
                  activaId={estado.activaId}
                  onSeleccionar={seleccionarConversacion}
                  onNuevo={nuevaConversacion}
                />
              ) : (
                <>
                  <div
                    aria-live="polite"
                    className="flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-5"
                  >
                    {activa.mensajes.map((mensaje) => (
                      <MensajeItem key={mensaje.id} mensaje={mensaje} />
                    ))}
                    {enviandoEn === activa.id && (
                      <div role="status" className="flex justify-start">
                        <div className="rounded-lg rounded-bl-sm border border-parchment-border/80 bg-surface-container-lowest px-3.5 py-2.5 shadow-sm">
                          <span className="animate-pulse font-sans text-sm text-on-surface-variant">
                            Escribiendo…
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={finMensajes} />
                  </div>

                  <InputChat
                    enviando={enviando}
                    onEnviar={enviarMensaje}
                    onHistorial={() => setVerHistorial(true)}
                  />
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
