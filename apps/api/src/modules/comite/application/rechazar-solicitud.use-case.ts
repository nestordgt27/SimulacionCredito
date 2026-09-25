import { Inject, Injectable } from '@nestjs/common';
import type { EstadoSolicitud } from '@simulacion-credito/shared';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../core/domain/unit-of-work';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../solicitudes/domain/solicitud.repository';
import { buscarSolicitud, registrarEvaluacion } from './evaluacion';

export interface RechazarSolicitudComando {
  solicitudId: number;
  observaciones: string | null;
  evaluadorId: number;
}

export interface ResultadoRechazo {
  solicitudId: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
}

@Injectable()
export class RechazarSolicitudUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  ejecutar({
    solicitudId,
    observaciones,
    evaluadorId,
  }: RechazarSolicitudComando): Promise<ResultadoRechazo> {
    return this.unitOfWork.run(async () => {
      const pendiente = await buscarSolicitud(this.solicitudes, solicitudId);
      const rechazada = pendiente.rechazar(observaciones, evaluadorId, this.clock.ahora());
      await registrarEvaluacion(this.solicitudes, rechazada, pendiente.estado);

      return {
        solicitudId: rechazada.id,
        estado: rechazada.estado,
        observaciones: rechazada.observaciones,
      };
    });
  }
}
