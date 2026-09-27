import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sesionStore } from '../../../shared/auth/sesion-store';
import { cerrarSesion } from '../api/auth.api';

// La sesión local se cierra siempre, aunque falle la revocación en el servidor
// (por ejemplo, sin conexión): el usuario pidió salir.
export function useCerrarSesion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const sesion = sesionStore.obtener();
      if (sesion) {
        await cerrarSesion(sesion.refreshToken);
      }
    },
    onSettled: () => {
      sesionStore.cerrar();
      queryClient.clear();
    },
  });
}
