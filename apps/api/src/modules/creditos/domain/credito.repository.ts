import type { Credito } from './credito';

/** Datos del crédito que necesita el desembolso. */
export interface CreditoResumen {
  id: number;
  numeroCredito: string;
  montoCentavos: number;
}

export interface CreditoRepository {
  /** Inserta el crédito y todas sus cuotas. Debe ejecutarse dentro de un UnitOfWork. */
  crear(credito: Credito): Promise<void>;
  buscarPorSolicitud(solicitudId: number): Promise<CreditoResumen | null>;
}

export const CREDITO_REPOSITORY = Symbol('CREDITO_REPOSITORY');
