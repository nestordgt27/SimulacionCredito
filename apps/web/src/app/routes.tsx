import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
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
        children: [{ index: true, element: <InicioPage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
