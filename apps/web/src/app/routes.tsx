import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { BandejaComitePage } from '../features/comite/pages/BandejaComitePage';
import { RevisionSolicitudPage } from '../features/comite/pages/RevisionSolicitudPage';
import { NuevaSolicitudPage } from '../features/solicitudes/pages/NuevaSolicitudPage';
import { AppLayout } from './AppLayout';
import { InicioPage } from './InicioPage';
import { RutaProtegida } from './RutaProtegida';

// Cada feature (solicitudes, comite, desembolsos, consulta) agrega aquí sus rutas protegidas.
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <InicioPage /> },
          { path: 'solicitudes/nueva', element: <NuevaSolicitudPage /> },
          { path: 'comite', element: <BandejaComitePage /> },
          { path: 'comite/:id', element: <RevisionSolicitudPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
