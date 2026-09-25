import { EDAD_MAXIMA } from '@simulacion-credito/shared';
import { ErrorDeDominio } from '../../../core/domain/error-de-dominio';

export class EdadNoPermitidaError extends ErrorDeDominio {
  readonly tipo = 'REGLA_NEGOCIO';
  readonly codigo = 'EDAD_NO_PERMITIDA';

  constructor(readonly edad: number) {
    super(`El cliente tiene ${edad} años; la edad máxima permitida es ${EDAD_MAXIMA}`);
  }
}

export class FechaNacimientoInvalidaError extends ErrorDeDominio {
  readonly tipo = 'REGLA_NEGOCIO';
  readonly codigo = 'FECHA_NACIMIENTO_INVALIDA';

  constructor() {
    super('La fecha de nacimiento no puede ser posterior a la fecha actual');
  }
}
