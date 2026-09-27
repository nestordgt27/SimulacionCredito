import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import {
  SOLICITUD_REPOSITORY,
  type FiltroSolicitudes,
  type SolicitudRepository,
} from '../domain/solicitud.repository';
import { aSolicitudVista, type SolicitudVista } from './solicitud-vista';

@Injectable()
export class ListarSolicitudesUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async ejecutar(filtro: FiltroSolicitudes): Promise<SolicitudVista[]> {
    const ahora = this.clock.ahora();
    const solicitudes = await this.solicitudes.listar(filtro);
    return solicitudes.map((solicitud) => aSolicitudVista(solicitud, ahora));
  }
}
