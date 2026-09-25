import { Module } from '@nestjs/common';
import { ConsultarCreditosUseCase } from './application/consultar-creditos.use-case';
import { CONSULTA_CREDITOS } from './domain/consulta-creditos';
import { CREDITO_REPOSITORY } from './domain/credito.repository';
import { NUMERO_CREDITO_GENERATOR } from './domain/numero-credito.generator';
import { PrismaConsultaCreditos } from './infrastructure/prisma-consulta-creditos';
import { PrismaCreditoRepository } from './infrastructure/prisma-credito.repository';
import { PrismaNumeroCreditoGenerator } from './infrastructure/prisma-numero-credito.generator';
import { CreditosController } from './presentation/creditos.controller';

// Créditos otorgados, su plan de pagos y la consulta por cédula.
// Capas: domain / application / infrastructure / presentation (CLAUDE.md §2.2).
@Module({
  controllers: [CreditosController],
  providers: [
    ConsultarCreditosUseCase,
    { provide: CREDITO_REPOSITORY, useClass: PrismaCreditoRepository },
    { provide: NUMERO_CREDITO_GENERATOR, useClass: PrismaNumeroCreditoGenerator },
    { provide: CONSULTA_CREDITOS, useClass: PrismaConsultaCreditos },
  ],
  exports: [CREDITO_REPOSITORY, NUMERO_CREDITO_GENERATOR],
})
export class CreditosModule {}
