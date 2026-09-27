import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { desembolsar, listarAprobadas } from '../api/desembolsos.api';
import type { DatosBancarios } from '../schemas/desembolso.schema';

export const clavesDesembolsos = {
  // Comparte el prefijo ['solicitudes'], que invalidan el registro y el comité.
  aprobadas: ['solicitudes', { estado: 'APROBADA' }] as const,
};

export function useSolicitudesAprobadas() {
  return useQuery({ queryKey: clavesDesembolsos.aprobadas, queryFn: listarAprobadas });
}

export function useDesembolsar(solicitudId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: DatosBancarios) => desembolsar(solicitudId, datos),
    // La solicitud deja de estar APROBADA y el crédito cambia (consulta por cédula).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
        queryClient.invalidateQueries({ queryKey: ['creditos'] }),
      ]),
  });
}
