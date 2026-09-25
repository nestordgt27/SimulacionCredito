import { Injectable } from '@nestjs/common';
import type { UnitOfWork } from '../core/domain/unit-of-work';
import { PrismaTransactionContext } from './prisma-transaction-context';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contexto: PrismaTransactionContext,
  ) {}

  run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.contexto.enTransaccion) {
      return fn();
    }
    return this.prisma.$transaction((transaccion) => this.contexto.ejecutarCon(transaccion, fn));
  }
}
