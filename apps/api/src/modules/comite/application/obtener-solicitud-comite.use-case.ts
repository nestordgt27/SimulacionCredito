import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../solicitudes/domain/solicitud.repository';
import { buscarSolicitud } from '../../solicitudes/application/transiciones';
import { aSolicitudComiteVista, type SolicitudComiteVista } from './solicitud-comite-vista';

@Injectable()
export class ObtenerSolicitudComiteUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async ejecutar(id: number): Promise<SolicitudComiteVista> {
    const solicitud = await buscarSolicitud(this.solicitudes, id);
    return aSolicitudComiteVista(solicitud, this.clock.ahora());
  }
}
