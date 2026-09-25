import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../../../core/auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';
import { CrearSolicitudUseCase } from '../application/crear-solicitud.use-case';
import { ListarSolicitudesUseCase } from '../application/listar-solicitudes.use-case';
import type { SolicitudVista } from '../application/solicitud-vista';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { ListarSolicitudesQuery } from './dto/listar-solicitudes.query';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(
    private readonly crearSolicitud: CrearSolicitudUseCase,
    private readonly listarSolicitudes: ListarSolicitudesUseCase,
  ) {}

  @Post()
  crear(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() { cliente, empleo, credito }: CrearSolicitudDto,
  ): Promise<SolicitudVista> {
    // credito.cuotaNivelada se descarta a propósito: la cuota la calcula el dominio.
    return this.crearSolicitud.ejecutar({
      cliente: { ...cliente, fechaNacimiento: new Date(`${cliente.fechaNacimiento}T00:00:00Z`) },
      empleo,
      credito: {
        monto: credito.monto,
        tasaAnual: credito.tasaAnual,
        cantidadCuotas: credito.cantidadCuotas,
        periodicidad: credito.periodicidad,
      },
      creadaPorId: usuario.id,
    });
  }

  @Get()
  listar(@Query() { estado }: ListarSolicitudesQuery): Promise<SolicitudVista[]> {
    return this.listarSolicitudes.ejecutar({ estado });
  }
}
