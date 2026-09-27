import { SolicitudNoEncontradaError, TransicionInvalidaError } from '../domain/errores';
import type { Solicitud } from '../domain/solicitud';
import type { SolicitudRepository, Transicion } from '../domain/solicitud.repository';

// Pasos comunes de los casos de uso que cambian el estado de una solicitud (comité, desembolsos).

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
export async function registrarTransicion(
  solicitudes: SolicitudRepository,
  solicitud: Solicitud,
  transicion: Transicion,
): Promise<void> {
  const registrada = await solicitudes.registrarTransicion(solicitud, transicion);
  if (!registrada) {
    throw new TransicionInvalidaError(transicion.estadoAnterior, solicitud.estado);
  }
}
