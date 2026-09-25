import { ErrorDeDominio } from '../../../core/domain/error-de-dominio';

// Solo ocurre con datos inconsistentes: toda solicitud APROBADA tiene su crédito
// (se crean en la misma transacción).
export class CreditoNoEncontradoError extends ErrorDeDominio {
  readonly tipo = 'NO_ENCONTRADO';
  readonly codigo = 'CREDITO_NO_ENCONTRADO';

  constructor(solicitudId: number) {
    super(`La solicitud ${solicitudId} no tiene un crédito otorgado`);
  }
}
