import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aprobarSolicitud,
  listarPendientes,
  obtenerSolicitud,
  rechazarSolicitud,
} from '../api/comite.api';

export const clavesComite = {
  // Comparte el prefijo ['solicitudes'] con el registro, que lo invalida al crear.
  pendientes: ['solicitudes', { estado: 'PENDIENTE' }] as const,
  solicitud: (id: number) => ['comite', 'solicitud', id] as const,
};

export function useSolicitudesPendientes() {
  return useQuery({ queryKey: clavesComite.pendientes, queryFn: listarPendientes });
}

export function useSolicitudComite(id: number) {
  return useQuery({ queryKey: clavesComite.solicitud(id), queryFn: () => obtenerSolicitud(id) });
}

// Tras un dictamen la solicitud deja de estar pendiente: se invalida todo lo de solicitudes.
function useInvalidarSolicitudes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
}

export function useAprobarSolicitud(id: number) {
  const invalidar = useInvalidarSolicitudes();
  return useMutation({
    mutationFn: (observaciones: string) => aprobarSolicitud(id, observaciones),
    onSuccess: invalidar,
  });
}

export function useRechazarSolicitud(id: number) {
  const invalidar = useInvalidarSolicitudes();
  return useMutation({
    mutationFn: (observaciones: string | undefined) => rechazarSolicitud(id, observaciones),
    onSuccess: invalidar,
  });
}
