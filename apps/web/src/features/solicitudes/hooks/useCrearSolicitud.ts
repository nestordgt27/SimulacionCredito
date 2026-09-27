import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearSolicitud } from '../api/solicitudes.api';

export function useCrearSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearSolicitud,
    // Los listados de solicitudes (feature del comité) quedan desactualizados.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });
}
