export interface NumeroCreditoGenerator {
  /** Siguiente número CR-AAAA-NNNNNN del año. Debe ejecutarse dentro del UnitOfWork de la aprobación. */
  generar(anio: number): Promise<string>;
}

export const NUMERO_CREDITO_GENERATOR = Symbol('NUMERO_CREDITO_GENERATOR');
