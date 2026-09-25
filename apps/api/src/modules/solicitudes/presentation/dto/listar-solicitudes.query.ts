import { EstadoSolicitud } from '@simulacion-credito/shared';
import { IsIn, IsOptional } from 'class-validator';

export class ListarSolicitudesQuery {
  @IsOptional()
  @IsIn(Object.values(EstadoSolicitud))
  estado?: EstadoSolicitud;
}
