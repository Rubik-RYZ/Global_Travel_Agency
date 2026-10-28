import { createBrowserRouter } from 'react-router-dom'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RutaAdmin, RutaCliente, RutaPanel } from '@/components/layout/RutaProtegida'
import { ForbiddenView } from '@/views/ForbiddenView'
import { NotFoundView } from '@/views/NotFoundView'
import { AuditoriaView } from '@/views/admin/AuditoriaView'
import { ClientesAdminView } from '@/views/admin/ClientesAdminView'
import { DashboardView } from '@/views/admin/DashboardView'
import { FichaClienteAdminView } from '@/views/admin/FichaClienteAdminView'
import { RolesView } from '@/views/admin/RolesView'
import { LoginView } from '@/views/auth/LoginView'
import { RecuperarPasswordView } from '@/views/auth/RecuperarPasswordView'
import { RegisterView } from '@/views/auth/RegisterView'
import { RestablecerPasswordView } from '@/views/auth/RestablecerPasswordView'
import { SesionExpiradaView } from '@/views/auth/SesionExpiradaView'
import { DetalleDestinoView } from '@/views/catalogo/DetalleDestinoView'
import { ExplorarDestinosView } from '@/views/catalogo/ExplorarDestinosView'
import { PanelViajeroView } from '@/views/cliente/PanelViajeroView'
import { PreferenciasView } from '@/views/cliente/PreferenciasView'
import { HomeView } from '@/views/home/HomeView'

/**
 * Router principal.
 *
 * CU1: acceso (público), panel protegido por rol.
 * CU2: área privada del viajero (/mi-cuenta) y directorio de viajeros del panel.
 * CU3 agregará /destinos, el resto del panel y la landing definitiva.
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomeView /> },
      { path: '/destinos', element: <ExplorarDestinosView /> },
      { path: '/destinos/:id', element: <DetalleDestinoView /> },
    ],
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
    element: <RutaCliente />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/mi-cuenta', element: <PanelViajeroView /> },
          { path: '/mi-cuenta/preferencias', element: <PreferenciasView /> },
        ],
      },
    ],
  },
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
          { path: '/admin/clientes', element: <ClientesAdminView /> },
          { path: '/admin/clientes/:id', element: <FichaClienteAdminView /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundView /> },
])