import { Navigate, Outlet, useLocation } from 'react-router';
import { useSesion } from '../shared/auth/useSesion';

// Sin sesión redirige al login recordando la ruta pedida, con sus parámetros (?cedula=…&pagina=…):
// así un enlace compartido llega a su destino tras iniciar sesión. Si la sesión se cierra
// (logout o refresh fallido), el cambio en el store vuelve a renderizar y redirige.
export function RutaProtegida() {
  const sesion = useSesion();
  const location = useLocation();

  if (!sesion) {
    const desde = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ desde }} />;
  }
  return <Outlet />;
}
