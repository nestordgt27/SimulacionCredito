import type { Desembolso } from './desembolso';

export interface DesembolsoRepository {
  /** Un crédito se desembolsa una sola vez. Debe ejecutarse dentro de un UnitOfWork. */
  crear(desembolso: Desembolso): Promise<void>;
}

export const DESEMBOLSO_REPOSITORY = Symbol('DESEMBOLSO_REPOSITORY');
