import { Module } from '@nestjs/common';
import { CreditosModule } from '../creditos/creditos.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { AprobarSolicitudUseCase } from './application/aprobar-solicitud.use-case';
import { ObtenerSolicitudComiteUseCase } from './application/obtener-solicitud-comite.use-case';
import { RechazarSolicitudUseCase } from './application/rechazar-solicitud.use-case';
import { ComiteController } from './presentation/comite.controller';

// Revisión del comité: vista reducida de la solicitud, aprobación (con crédito y plan de pagos)
// y rechazo. Capas: application / presentation; el dominio vive en solicitudes y creditos.
@Module({
  imports: [SolicitudesModule, CreditosModule],
  controllers: [ComiteController],
  providers: [ObtenerSolicitudComiteUseCase, AprobarSolicitudUseCase, RechazarSolicitudUseCase],
})
export class ComiteModule {}
