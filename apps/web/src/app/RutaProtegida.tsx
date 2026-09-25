import { Navigate, Outlet, useLocation } from 'react-router';
import { useSesion } from '../shared/auth/useSesion';

// Sin sesión redirige al login recordando la ruta pedida. Si la sesión se cierra
// (logout o refresh fallido), el cambio en el store vuelve a renderizar y redirige.
export function RutaProtegida() {
  const sesion = useSesion();
  const location = useLocation();

  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  return <Outlet />;
}
