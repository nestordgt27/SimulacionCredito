import { Navigate, useLocation } from 'react-router';
import { mensajeDeError } from '../../../shared/api/errores';
import { useSesion } from '../../../shared/auth/useSesion';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import { LoginForm } from '../components/LoginForm';
import { useIniciarSesion } from '../hooks/useIniciarSesion';

interface EstadoNavegacion {
  desde?: string;
}

export function LoginPage() {
  const sesion = useSesion();
  const location = useLocation();
  const iniciarSesion = useIniciarSesion();
  const destino = (location.state as EstadoNavegacion | null)?.desde ?? '/';

  // Al guardarse la sesión tras el login, este mismo render redirige al destino.
  if (sesion) {
    return <Navigate to={destino} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Tarjeta className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-900">Simulación de Crédito</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">Inicia sesión para continuar</p>
        <LoginForm
          enviando={iniciarSesion.isPending}
          error={
            iniciarSesion.isError
              ? mensajeDeError(iniciarSesion.error, 'No se pudo iniciar sesión')
              : undefined
          }
          onSubmit={(credenciales) => iniciarSesion.mutate(credenciales)}
        />
      </Tarjeta>
    </main>
  );
}
