import { Module } from '@nestjs/common';
import { CREDITO_REPOSITORY } from './domain/credito.repository';
import { NUMERO_CREDITO_GENERATOR } from './domain/numero-credito.generator';
import { PrismaCreditoRepository } from './infrastructure/prisma-credito.repository';
import { PrismaNumeroCreditoGenerator } from './infrastructure/prisma-numero-credito.generator';

// Créditos otorgados y su plan de pagos. La consulta HTTP se agrega en su propia rama.
// Capas: domain / application / infrastructure / presentation (CLAUDE.md §2.2).
@Module({
  providers: [
    { provide: CREDITO_REPOSITORY, useClass: PrismaCreditoRepository },
    { provide: NUMERO_CREDITO_GENERATOR, useClass: PrismaNumeroCreditoGenerator },
  ],
  exports: [CREDITO_REPOSITORY, NUMERO_CREDITO_GENERATOR],
})
export class CreditosModule {}
