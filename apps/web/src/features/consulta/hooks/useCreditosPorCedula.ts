import { useQuery } from '@tanstack/react-query';
import { consultarCreditos } from '../api/creditos.api';

/** Créditos del cliente. No consulta mientras no haya una cédula válida que buscar. */
export function useCreditosPorCedula(cedula: string | null) {
  return useQuery({
    queryKey: ['creditos', cedula],
    // enabled garantiza que la cédula no es null cuando se ejecuta.
    queryFn: () => consultarCreditos(cedula ?? ''),
    enabled: cedula !== null,
  });
}
