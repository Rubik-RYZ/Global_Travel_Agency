/** Roles del sistema (coinciden con el catálogo `roles` de la BD). */
export const ROLES = {
  ADMINISTRADOR: 'administrador',
  AGENTE: 'agente',
  CLIENTE: 'cliente',
} as const

export type RolNombre = (typeof ROLES)[keyof typeof ROLES]

export function esAdmin(rol?: RolNombre | null): boolean {
  return rol === ROLES.ADMINISTRADOR
}

export function esPanel(rol?: RolNombre | null): boolean {
  return rol === ROLES.ADMINISTRADOR || rol === ROLES.AGENTE
}
