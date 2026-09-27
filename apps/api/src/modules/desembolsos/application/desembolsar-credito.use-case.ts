import { Inject, Injectable } from '@nestjs/common';
import type { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { desdeCentavos } from '../../../core/domain/dinero';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../core/domain/unit-of-work';
import {
  CREDITO_REPOSITORY,
  type CreditoRepository,
} from '../../creditos/domain/credito.repository';
import { CreditoNoEncontradoError } from '../../creditos/domain/errores';
import { buscarSolicitud, registrarTransicion } from '../../solicitudes/application/transiciones';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../solicitudes/domain/solicitud.repository';
import { Desembolso } from '../domain/desembolso';
import { DESEMBOLSO_REPOSITORY, type DesembolsoRepository } from '../domain/desembolso.repository';

export interface DesembolsarCreditoComando {
  solicitudId: number;
  banco: Banco;
  numeroCuenta: string;
  usuarioId: number;
}

export interface ResultadoDesembolso {
  solicitudId: number;
  estado: EstadoSolicitud;
  desembolso: {
    numeroCredito: string;
    banco: Banco;
    numeroCuenta: string;
    monto: number;
    fechaDesembolso: Date;
  };
}

// En una sola transacción (CLAUDE.md §2.3): validar que la solicitud esté APROBADA,
// pasarla a DESEMBOLSADA (con historial) y registrar el desembolso del crédito.
@Injectable()
export class DesembolsarCreditoUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(CREDITO_REPOSITORY) private readonly creditos: CreditoRepository,
    @Inject(DESEMBOLSO_REPOSITORY) private readonly desembolsos: DesembolsoRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  ejecutar({
    solicitudId,
    banco,
    numeroCuenta,
    usuarioId,
  }: DesembolsarCreditoComando): Promise<ResultadoDesembolso> {
    return this.unitOfWork.run(async () => {
      const ahora = this.clock.ahora();
      const aprobada = await buscarSolicitud(this.solicitudes, solicitudId);
      const desembolsada = aprobada.desembolsar();

      const credito = await this.creditos.buscarPorSolicitud(solicitudId);
      if (!credito) {
        throw new CreditoNoEncontradoError(solicitudId);
      }

      await registrarTransicion(this.solicitudes, desembolsada, {
        estadoAnterior: aprobada.estado,
        usuarioId,
        fecha: ahora,
        comentario: `Desembolso en ${banco}`,
      });
      const desembolso = Desembolso.registrar(
        { credito, banco, numeroCuenta, desembolsadoPorId: usuarioId },
        ahora,
      );
      await this.desembolsos.crear(desembolso);

      return {
        solicitudId,
        estado: desembolsada.estado,
        desembolso: {
          numeroCredito: desembolso.numeroCredito,
          banco: desembolso.banco,
          numeroCuenta: desembolso.numeroCuenta,
          monto: desdeCentavos(desembolso.montoCentavos),
          fechaDesembolso: desembolso.fecha,
        },
      };
    });
  }
}
