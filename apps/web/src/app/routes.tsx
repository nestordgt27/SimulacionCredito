import type { RouteObject } from 'react-router';
import { AppLayout } from './AppLayout';
import { InicioPage } from './InicioPage';

// Cada feature (auth, solicitudes, comite, desembolsos, consulta) agrega aquí sus rutas.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [{ index: true, element: <InicioPage /> }],
  },
];
