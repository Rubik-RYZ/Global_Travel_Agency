/** Schemas Zod de los formularios de CU1 (validación de entrada). */
import { z } from 'zod'

const email = z
  .string()
  .min(1, 'El email es obligatorio.')
  .email('Ingresa un email válido.')

const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

export const registroSchema = z.object({
  email,
  password,
  nombres: z.string().min(1, 'Los nombres son obligatorios.').max(120),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios.').max(120),
})

export const recuperarSchema = z.object({ email })

export const restablecerSchema = z
  .object({
    password,
    confirmar: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmar, {
    path: ['confirmar'],
    message: 'Las contraseñas no coinciden.',
  })

export const usuarioEquipoSchema = z.object({
  email,
  rol_id: z.coerce.number().int().positive('Selecciona un rol.'),
  activo: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegistroForm = z.infer<typeof registroSchema>
export type RecuperarForm = z.infer<typeof recuperarSchema>
export type RestablecerForm = z.infer<typeof restablecerSchema>
export type UsuarioEquipoForm = z.infer<typeof usuarioEquipoSchema>
