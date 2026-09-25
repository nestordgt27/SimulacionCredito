import { useSesion } from '../shared/auth/useSesion';
import { Tarjeta } from '../shared/ui/Tarjeta';

// Página de inicio provisional: las features (solicitudes, comité, desembolsos, consulta)
// agregan sus pantallas en sus propias ramas.
export function InicioPage() {
  const sesion = useSesion();

  return (
    <Tarjeta>
      <h2 className="text-lg font-semibold text-slate-900">
        Bienvenido, {sesion?.usuario.nombreCompleto}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Gestión del ciclo de vida de solicitudes de crédito.
      </p>
    </Tarjeta>
  );
}
