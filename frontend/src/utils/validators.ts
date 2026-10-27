/** Helpers Zod comunes reutilizables en todos los formularios. */
import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'El email es obligatorio.')
  .email('Ingresa un email válido.')

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')

export const nombreSchema = z
  .string()
  .min(1, 'Este campo es obligatorio.')
  .max(120, 'Máximo 120 caracteres.')

/** Mensaje de error legible a partir de una respuesta de la API. */
export function mensajeDeError(error: unknown): string {
  const err = error as {
    response?: { data?: { error?: string } }
    message?: string
  }
  return err?.response?.data?.error ?? err?.message ?? 'Ocurrió un error inesperado.'
}
