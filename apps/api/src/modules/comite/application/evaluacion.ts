import type { EstadoSolicitud } from '@simulacion-credito/shared';
import {
  SolicitudNoEncontradaError,
  TransicionInvalidaError,
} from '../../solicitudes/domain/errores';
import type { Solicitud } from '../../solicitudes/domain/solicitud';
import type { SolicitudRepository } from '../../solicitudes/domain/solicitud.repository';

// Pasos comunes de los casos de uso del comité.

export async function buscarSolicitud(
  solicitudes: SolicitudRepository,
  id: number,
): Promise<Solicitud> {
  const solicitud = await solicitudes.buscarPorId(id);
  if (!solicitud) {
    throw new SolicitudNoEncontradaError(id);
  }
  return solicitud;
}

/** Si otra petición cambió el estado entre la lectura y la escritura, es un conflicto (409). */
export async function registrarEvaluacion(
  solicitudes: SolicitudRepository,
  evaluada: Solicitud,
  estadoAnterior: EstadoSolicitud,
): Promise<void> {
  const registrada = await solicitudes.registrarEvaluacion(evaluada, estadoAnterior);
  if (!registrada) {
    throw new TransicionInvalidaError(estadoAnterior, evaluada.estado);
  }
}
