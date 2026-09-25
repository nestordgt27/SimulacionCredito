import type { EstadoSolicitud } from '@simulacion-credito/shared';
import type { Solicitud } from './solicitud';

export interface FiltroSolicitudes {
  estado?: EstadoSolicitud;
}

export interface SolicitudRepository {
  /**
   * Persiste una solicitud nueva: registra o actualiza al cliente por cédula, crea la solicitud
   * y su primera entrada de historial (null → PENDIENTE). Debe ejecutarse dentro de un UnitOfWork.
   */
  crear(solicitud: Solicitud): Promise<Solicitud>;
  /** Más recientes primero. */
  listar(filtro: FiltroSolicitudes): Promise<Solicitud[]>;
}

export const SOLICITUD_REPOSITORY = Symbol('SOLICITUD_REPOSITORY');
