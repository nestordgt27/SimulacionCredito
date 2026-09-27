import { Module } from '@nestjs/common';
import { CreditosModule } from '../creditos/creditos.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { DesembolsarCreditoUseCase } from './application/desembolsar-credito.use-case';
import { DESEMBOLSO_REPOSITORY } from './domain/desembolso.repository';
import { PrismaDesembolsoRepository } from './infrastructure/prisma-desembolso.repository';
import { DesembolsosController } from './presentation/desembolsos.controller';

// Desembolso de créditos aprobados.
// Capas: domain / application / infrastructure / presentation (CLAUDE.md §2.2).
@Module({
  imports: [SolicitudesModule, CreditosModule],
  controllers: [DesembolsosController],
  providers: [
    DesembolsarCreditoUseCase,
    { provide: DESEMBOLSO_REPOSITORY, useClass: PrismaDesembolsoRepository },
  ],
})
export class DesembolsosModule {}
