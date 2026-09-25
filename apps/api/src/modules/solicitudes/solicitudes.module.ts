import { Module } from '@nestjs/common';
import { CrearSolicitudUseCase } from './application/crear-solicitud.use-case';
import { ListarSolicitudesUseCase } from './application/listar-solicitudes.use-case';
import { SOLICITUD_REPOSITORY } from './domain/solicitud.repository';
import { PrismaSolicitudRepository } from './infrastructure/prisma-solicitud.repository';
import { SolicitudesController } from './presentation/solicitudes.controller';

// Registro y consulta de solicitudes de crédito.
// Capas: domain / application / infrastructure / presentation (CLAUDE.md §2.2).
@Module({
  controllers: [SolicitudesController],
  providers: [
    CrearSolicitudUseCase,
    ListarSolicitudesUseCase,
    { provide: SOLICITUD_REPOSITORY, useClass: PrismaSolicitudRepository },
  ],
  exports: [SOLICITUD_REPOSITORY],
})
export class SolicitudesModule {}
