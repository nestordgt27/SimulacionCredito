import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { BandejaComitePage } from '../features/comite/pages/BandejaComitePage';
import { RevisionSolicitudPage } from '../features/comite/pages/RevisionSolicitudPage';
import { ConsultaCreditosPage } from '../features/consulta/pages/ConsultaCreditosPage';
import { BandejaDesembolsosPage } from '../features/desembolsos/pages/BandejaDesembolsosPage';
import { DesembolsarPage } from '../features/desembolsos/pages/DesembolsarPage';
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
          { path: 'desembolsos', element: <BandejaDesembolsosPage /> },
          { path: 'desembolsos/:solicitudId', element: <DesembolsarPage /> },
          { path: 'creditos', element: <ConsultaCreditosPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
