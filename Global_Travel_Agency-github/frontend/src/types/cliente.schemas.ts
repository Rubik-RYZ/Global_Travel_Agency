/** Schemas Zod de los formularios de CU2 (perfil y preferencias del viajero). */
import { z } from 'zod'

const textoOpcional = z
  .string()
  .max(120, 'Máximo 120 caracteres.')
  .optional()
  .or(z.literal(''))

const documento = z
  .union([z.enum(['CI', 'PASAPORTE', 'OTRO']), z.literal('')])
  .optional()

/** Datos personales del viajero (usado en «Mi viaje» y en el panel). */
export const perfilSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios.').max(120),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios.').max(120),
  documento_tipo: documento,
  documento_numero: textoOpcional,
  telefono: textoOpcional,
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  pais_origen: textoOpcional,
})

export type PerfilForm = z.infer<typeof perfilSchema>

/** Preferencias de viaje del viajero. */
export const preferenciasSchema = z.object({
  presupuesto_max: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      'Ingresa un monto válido.',
    ),
  moneda: z.enum(['USD', 'BOB', 'EUR']),
  intereses: z.array(z.string()),
})

export type PreferenciasForm = z.infer<typeof preferenciasSchema>
