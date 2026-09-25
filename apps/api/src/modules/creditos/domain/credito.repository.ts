import type { Credito } from './credito';

export interface CreditoRepository {
  /** Inserta el crédito y todas sus cuotas. Debe ejecutarse dentro de un UnitOfWork. */
  crear(credito: Credito): Promise<void>;
}

export const CREDITO_REPOSITORY = Symbol('CREDITO_REPOSITORY');
