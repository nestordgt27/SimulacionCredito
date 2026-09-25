import { Outlet } from 'react-router';
import { useCerrarSesion } from '../features/auth/hooks/useCerrarSesion';
import { useSesion } from '../shared/auth/useSesion';
import { Boton } from '../shared/ui/Boton';

export function AppLayout() {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();

  return (
    <div className="min-h-screen">
      <header className="bg-teal-700 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Simulación de Crédito</h1>
          <div className="flex items-center gap-3 text-sm">
            <span>{sesion?.usuario.nombreCompleto}</span>
            <Boton
              variante="secundario"
              cargando={cerrarSesion.isPending}
              onClick={() => cerrarSesion.mutate()}
            >
              Cerrar sesión
            </Boton>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
