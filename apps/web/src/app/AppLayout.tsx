import { useId, useRef, useState, type KeyboardEvent } from 'react';
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

// Desde lg (1024 px) la barra cabe en una fila; por debajo, la navegación y la sesión se
// pliegan en un panel que abre el botón "Menú".
export function AppLayout() {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  function cerrarConEscape(evento: KeyboardEvent) {
    if (evento.key === 'Escape' && menuAbierto) {
      setMenuAbierto(false);
      botonMenu.current?.focus();
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-teal-700 text-white">
        <div className="mx-auto max-w-5xl px-4 py-3 lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold">Simulación de Crédito</h1>
            <button
              ref={botonMenu}
              type="button"
              aria-label="Menú"
              aria-expanded={menuAbierto}
              aria-controls={idPanel}
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              className="rounded-md p-2 hover:bg-teal-600 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none lg:hidden"
            >
              <IconoMenu abierto={menuAbierto} />
            </button>
          </div>
          <div
            id={idPanel}
            onKeyDown={cerrarConEscape}
            className={`${menuAbierto ? 'flex' : 'hidden'} mt-3 flex-col gap-3 lg:mt-0 lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:gap-6`}
          >
            <nav aria-label="Principal" className="flex flex-col gap-1 text-sm lg:flex-row">
              {ENLACES.map(({ ruta, texto }) => (
                <NavLink
                  key={ruta}
                  to={ruta}
                  end={ruta === '/'}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 lg:py-1.5 ${isActive ? 'bg-teal-800 font-medium' : 'hover:bg-teal-600'}`
                  }
                >
                  {texto}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-3 border-t border-teal-600 pt-3 text-sm lg:border-0 lg:pt-0">
              <span className="min-w-0 truncate">{sesion?.usuario.nombreCompleto}</span>
              <Boton
                variante="secundario"
                cargando={cerrarSesion.isPending}
                onClick={() => cerrarSesion.mutate()}
              >
                Cerrar sesión
              </Boton>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function IconoMenu({ abierto }: { abierto: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}
