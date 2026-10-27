import { createBrowserRouter } from 'react-router-dom'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RutaAdmin, RutaPanel } from '@/components/layout/RutaProtegida'
import { ForbiddenView } from '@/views/ForbiddenView'
import { NotFoundView } from '@/views/NotFoundView'
import { AuditoriaView } from '@/views/admin/AuditoriaView'
import { DashboardView } from '@/views/admin/DashboardView'
import { RolesView } from '@/views/admin/RolesView'
import { LoginView } from '@/views/auth/LoginView'
import { RecuperarPasswordView } from '@/views/auth/RecuperarPasswordView'
import { RegisterView } from '@/views/auth/RegisterView'
import { RestablecerPasswordView } from '@/views/auth/RestablecerPasswordView'
import { SesionExpiradaView } from '@/views/auth/SesionExpiradaView'
import { HomeView } from '@/views/home/HomeView'

/**
 * Router principal.
 *
 * CU1: acceso (público), panel protegido por rol.
 * CU2/CU3 agregarán las rutas de /mi-cuenta, /destinos y el resto del panel.
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: '/', element: <HomeView /> }],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginView /> },
      { path: '/registro', element: <RegisterView /> },
      { path: '/recuperar', element: <RecuperarPasswordView /> },
      { path: '/restablecer', element: <RestablecerPasswordView /> },
    ],
  },
  { path: '/sesion-expirada', element: <SesionExpiradaView /> },
  { path: '/403', element: <ForbiddenView /> },
  {
    element: <RutaPanel />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <DashboardView /> },
          {
            path: '/admin/roles',
            element: <RutaAdmin />,
            children: [{ index: true, element: <RolesView /> }],
          },
          {
            path: '/admin/auditoria',
            element: <RutaAdmin />,
            children: [{ index: true, element: <AuditoriaView /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundView /> },
])