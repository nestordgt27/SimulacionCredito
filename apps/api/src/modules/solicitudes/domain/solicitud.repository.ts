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
  buscarPorId(id: number): Promise<Solicitud | null>;
  /**
   * Guarda el dictamen (estado, observaciones, evaluador y fecha) y su entrada de historial,
   * solo si la solicitud sigue en `estadoAnterior`. Devuelve `false` si otro proceso ya la
   * cambió (control de concurrencia optimista). Debe ejecutarse dentro de un UnitOfWork.
   */
  registrarEvaluacion(solicitud: Solicitud, estadoAnterior: EstadoSolicitud): Promise<boolean>;
}

export const SOLICITUD_REPOSITORY = Symbol('SOLICITUD_REPOSITORY');
