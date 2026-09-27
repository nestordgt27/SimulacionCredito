import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UsuarioActual } from '../../../core/auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';
import {
  AprobarSolicitudUseCase,
  type ResultadoAprobacion,
} from '../application/aprobar-solicitud.use-case';
import { ObtenerSolicitudComiteUseCase } from '../application/obtener-solicitud-comite.use-case';
import {
  RechazarSolicitudUseCase,
  type ResultadoRechazo,
} from '../application/rechazar-solicitud.use-case';
import type { SolicitudComiteVista } from '../application/solicitud-comite-vista';
import { AprobarSolicitudDto, RechazarSolicitudDto } from './dto/evaluacion.dto';

@Controller('comite/solicitudes')
export class ComiteController {
  constructor(
    private readonly obtenerSolicitud: ObtenerSolicitudComiteUseCase,
    private readonly aprobarSolicitud: AprobarSolicitudUseCase,
    private readonly rechazarSolicitud: RechazarSolicitudUseCase,
  ) {}

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<SolicitudComiteVista> {
    return this.obtenerSolicitud.ejecutar(id);
  }

  @Post(':id/aprobar')
  @HttpCode(HttpStatus.OK)
  aprobar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: AprobarSolicitudDto,
  ): Promise<ResultadoAprobacion> {
    return this.aprobarSolicitud.ejecutar({
      solicitudId: id,
      observaciones: dto.observaciones,
      evaluadorId: usuario.id,
    });
  }

  @Post(':id/rechazar')
  @HttpCode(HttpStatus.OK)
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: RechazarSolicitudDto,
  ): Promise<ResultadoRechazo> {
    return this.rechazarSolicitud.ejecutar({
      solicitudId: id,
      observaciones: dto.observaciones ?? null,
      evaluadorId: usuario.id,
    });
  }
}
