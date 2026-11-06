/**
 * Instancia de Axios con:
 *  - baseURL desde VITE_API_URL
 *  - interceptor de request que adjunta el access token
 *  - interceptor de response que maneja el 401 (sesión expirada)
 */
import axios from 'axios'

import { tokenStorage } from '@/lib/storage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const esRutaAuth = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && !esRutaAuth) {
      tokenStorage.clear()
      if (window.location.pathname !== '/sesion-expirada') {
        window.location.assign('/sesion-expirada')
      }
    }
    return Promise.reject(error)
  },
)
