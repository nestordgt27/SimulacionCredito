import { NavLink, Outlet } from 'react-router';
import { useCerrarSesion } from '../features/auth/hooks/useCerrarSesion';
import { useSesion } from '../shared/auth/useSesion';
import { Boton } from '../shared/ui/Boton';

const ENLACES = [
  { ruta: '/', texto: 'Inicio' },
  { ruta: '/solicitudes/nueva', texto: 'Nueva solicitud' },
  { ruta: '/comite', texto: 'Comité' },
  { ruta: '/desembolsos', texto: 'Desembolsos' },
  { ruta: '/creditos', texto: 'Consulta' },
] as const;

export function AppLayout() {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();

  return (
    <div className="min-h-screen">
      <header className="bg-teal-700 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Simulación de Crédito</h1>
            <nav aria-label="Principal" className="flex gap-1 text-sm">
              {ENLACES.map(({ ruta, texto }) => (
                <NavLink
                  key={ruta}
                  to={ruta}
                  end={ruta === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 ${isActive ? 'bg-teal-800 font-medium' : 'hover:bg-teal-600'}`
                  }
                >
                  {texto}
                </NavLink>
              ))}
            </nav>
          </div>
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
