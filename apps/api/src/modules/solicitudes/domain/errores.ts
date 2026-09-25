import { EDAD_MAXIMA, type EstadoSolicitud } from '@simulacion-credito/shared';
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

export class SolicitudNoEncontradaError extends ErrorDeDominio {
  readonly tipo = 'NO_ENCONTRADO';
  readonly codigo = 'SOLICITUD_NO_ENCONTRADA';

  constructor(id: number) {
    super(`No existe la solicitud ${id}`);
  }
}

export class TransicionInvalidaError extends ErrorDeDominio {
  readonly tipo = 'CONFLICTO';
  readonly codigo = 'TRANSICION_INVALIDA';

  constructor(
    readonly desde: EstadoSolicitud,
    readonly hacia: EstadoSolicitud,
  ) {
    super(`La solicitud está ${desde} y no puede pasar a ${hacia}`);
  }
}

export class ObservacionesRequeridasError extends ErrorDeDominio {
  readonly tipo = 'REGLA_NEGOCIO';
  readonly codigo = 'OBSERVACIONES_REQUERIDAS';

  constructor() {
    super('Las observaciones son obligatorias para aprobar una solicitud');
  }
}
