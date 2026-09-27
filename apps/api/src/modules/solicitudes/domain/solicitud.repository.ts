import type { EstadoSolicitud } from '@simulacion-credito/shared';
import type { Solicitud } from './solicitud';

export interface FiltroSolicitudes {
  estado?: EstadoSolicitud;
}

/** Datos de la entrada de historial de un cambio de estado. */
export interface Transicion {
  estadoAnterior: EstadoSolicitud;
  /** Quién ejecuta el cambio (evaluador del comité, operador del desembolso, etc.). */
  usuarioId: number;
  fecha: Date;
  comentario: string | null;
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
   * Guarda el nuevo estado de la solicitud (con observaciones, evaluador y fecha de evaluación)
   * y su entrada de historial, solo si sigue en `transicion.estadoAnterior`. Devuelve `false`
   * si otro proceso ya la cambió (control de concurrencia optimista).
   * Debe ejecutarse dentro de un UnitOfWork.
   */
  registrarTransicion(solicitud: Solicitud, transicion: Transicion): Promise<boolean>;
}

export const SOLICITUD_REPOSITORY = Symbol('SOLICITUD_REPOSITORY');
