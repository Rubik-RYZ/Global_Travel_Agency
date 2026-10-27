import { createBrowserRouter } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { HomeView } from '@/views/home/HomeView'
import { NotFoundView } from '@/views/NotFoundView'

/**
 * Router principal.
 *
 * Las rutas de CU1 (auth), CU2 (clientes) y CU3 (catálogo) se agregan en las
 * fases 1–3, junto con los guards de rol (AdminLayout / AppLayout).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [{ index: true, element: <HomeView /> }],
  },
  {
    path: '*',
    element: <NotFoundView />,
  },
])
