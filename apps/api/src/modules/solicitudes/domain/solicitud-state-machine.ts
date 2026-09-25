import { EstadoSolicitud } from '@simulacion-credito/shared';
import { TransicionInvalidaError } from './errores';

// Única fuente de verdad sobre las transiciones de estado (CLAUDE.md §3.1 y §4).
const TRANSICIONES: Readonly<Record<EstadoSolicitud, readonly EstadoSolicitud[]>> = {
  [EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.APROBADA, EstadoSolicitud.RECHAZADA],
  [EstadoSolicitud.APROBADA]: [EstadoSolicitud.DESEMBOLSADA],
  [EstadoSolicitud.RECHAZADA]: [],
  [EstadoSolicitud.DESEMBOLSADA]: [],
};

export const SolicitudStateMachine = {
  puedeTransicionar(actual: EstadoSolicitud, destino: EstadoSolicitud): boolean {
    return TRANSICIONES[actual].includes(destino);
  },

  assertTransicion(actual: EstadoSolicitud, destino: EstadoSolicitud): void {
    if (!SolicitudStateMachine.puedeTransicionar(actual, destino)) {
      throw new TransicionInvalidaError(actual, destino);
    }
  },
};
