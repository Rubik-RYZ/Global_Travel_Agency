import { createBrowserRouter } from 'react-router-dom'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RutaAdmin, RutaCliente, RutaPanel } from '@/components/layout/RutaProtegida'
import { ForbiddenView } from '@/views/ForbiddenView'
import { NotFoundView } from '@/views/NotFoundView'
import { AsistenteIAAdminView } from '@/views/admin/AsistenteIAAdminView'
import { AuditoriaView } from '@/views/admin/AuditoriaView'
import { AtlasDestinosView } from '@/views/admin/AtlasDestinosView'
import { ClientesAdminView } from '@/views/admin/ClientesAdminView'
import { DashboardView } from '@/views/admin/DashboardView'
import { EditorDestinoView } from '@/views/admin/EditorDestinoView'
import { FichaClienteAdminView } from '@/views/admin/FichaClienteAdminView'
import { ProveedoresAdminView } from '@/views/admin/ProveedoresAdminView'
import { RecomendacionesAdminView } from '@/views/admin/RecomendacionesAdminView'
import { ReportesView } from '@/views/admin/ReportesView'
import { RolesView } from '@/views/admin/RolesView'
import { VuelosAdminView } from '@/views/admin/VuelosAdminView'
import { HotelesAdminView } from '@/views/admin/HotelesAdminView'
import { PaquetesAdminView } from '@/views/admin/PaquetesAdminView'
import { SalidasAdminView } from '@/views/admin/SalidasAdminView'
import { PagosAdminView } from '@/views/admin/PagosAdminView'
import { ReservasAdminView } from '@/views/admin/ReservasAdminView'
import { DetalleReservaAdminView } from '@/views/admin/DetalleReservaAdminView'
import { NuevaReservaAdminView } from '@/views/admin/NuevaReservaAdminView'
import { EditorItinerarioAdminView } from '@/views/admin/EditorItinerarioAdminView'
import { CatalogoPaquetesView } from '@/views/catalogo/CatalogoPaquetesView'
import { DetallePaqueteView } from '@/views/catalogo/DetallePaqueteView'
import { DisenaTuViajeView } from '@/views/catalogo/DisenaTuViajeView'
import { ReservaSeleccionView } from '@/views/reserva/ReservaSeleccionView'
import { ReservaPasajerosView } from '@/views/reserva/ReservaPasajerosView'
import { ReservaConfirmacionView } from '@/views/reserva/ReservaConfirmacionView'
import { MisViajesView } from '@/views/cliente/MisViajesView'
import { DetalleViajeView } from '@/views/cliente/DetalleViajeView'
import { ItinerarioView } from '@/views/cliente/ItinerarioView'
import { NotificacionesView } from '@/views/cliente/NotificacionesView'
import { LoginView } from '@/views/auth/LoginView'
import { RecuperarPasswordView } from '@/views/auth/RecuperarPasswordView'
import { RegisterView } from '@/views/auth/RegisterView'
import { RestablecerPasswordView } from '@/views/auth/RestablecerPasswordView'
import { SesionExpiradaView } from '@/views/auth/SesionExpiradaView'
import { DetalleDestinoView } from '@/views/catalogo/DetalleDestinoView'
import { ExplorarDestinosView } from '@/views/catalogo/ExplorarDestinosView'
import { PanelViajeroView } from '@/views/cliente/PanelViajeroView'
import { PreferenciasView } from '@/views/cliente/PreferenciasView'
import { RecomendacionesView } from '@/views/cliente/RecomendacionesView'
import { HomeView } from '@/views/home/HomeView'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomeView /> },
      { path: '/destinos', element: <ExplorarDestinosView /> },
      { path: '/destinos/:id', element: <DetalleDestinoView /> },
      { path: '/viajes', element: <CatalogoPaquetesView /> },
      { path: '/viajes/:id', element: <DetallePaqueteView /> },
      { path: '/diseña-tu-viaje', element: <DisenaTuViajeView /> },
      { path: '/disena-tu-viaje', element: <DisenaTuViajeView /> },
      { path: '/reservar/:paqueteId', element: <ReservaSeleccionView /> },
      { path: '/reservar/pasajeros', element: <ReservaPasajerosView /> },
      { path: '/reservar/confirmacion', element: <ReservaConfirmacionView /> },
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
          { path: '/mi-cuenta/viajes', element: <MisViajesView /> },
          { path: '/mi-cuenta/viajes/:id', element: <DetalleViajeView /> },
          { path: '/mi-cuenta/viajes/:id/itinerario', element: <ItinerarioView /> },
          { path: '/mi-cuenta/notificaciones', element: <NotificacionesView /> },
          { path: '/mi-cuenta/recomendaciones', element: <RecomendacionesView /> },
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
          {
            path: '/admin/reportes',
            element: <RutaAdmin />,
            children: [{ index: true, element: <ReportesView /> }],
          },
          {
            path: '/admin/asistente-ia',
            element: <RutaAdmin />,
            children: [{ index: true, element: <AsistenteIAAdminView /> }],
          },
          {
            path: '/admin/recomendaciones',
            element: <RutaAdmin />,
            children: [{ index: true, element: <RecomendacionesAdminView /> }],
          },
          { path: '/admin/clientes', element: <ClientesAdminView /> },
          { path: '/admin/clientes/:id', element: <FichaClienteAdminView /> },
          { path: '/admin/destinos', element: <AtlasDestinosView /> },
          { path: '/admin/destinos/nuevo', element: <EditorDestinoView /> },
          { path: '/admin/destinos/:id/editar', element: <EditorDestinoView /> },
          {
            path: '/admin/proveedores',
            element: <RutaAdmin />,
            children: [{ index: true, element: <ProveedoresAdminView /> }],
          },
          { path: '/admin/vuelos', element: <VuelosAdminView /> },
          { path: '/admin/hoteles', element: <HotelesAdminView /> },
          { path: '/admin/paquetes', element: <PaquetesAdminView /> },
          { path: '/admin/salidas', element: <SalidasAdminView /> },
          { path: '/admin/reservas', element: <ReservasAdminView /> },
          { path: '/admin/pagos', element: <PagosAdminView /> },
          { path: '/admin/reservas/nueva', element: <NuevaReservaAdminView /> },
          { path: '/admin/reservas/:id', element: <DetalleReservaAdminView /> },
          { path: '/admin/reservas/:id/itinerario', element: <EditorItinerarioAdminView /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundView /> },
])
