import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

// Guarda la transacción activa en el contexto asíncrono: los repositorios usan `cliente`
// y participan de la transacción del UnitOfWork sin recibirla como parámetro.
@Injectable()
export class PrismaTransactionContext {
  private readonly almacen = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  get cliente(): Prisma.TransactionClient {
    return this.almacen.getStore() ?? this.prisma;
  }

  get enTransaccion(): boolean {
    return this.almacen.getStore() !== undefined;
  }

  ejecutarCon<T>(transaccion: Prisma.TransactionClient, fn: () => Promise<T>): Promise<T> {
    return this.almacen.run(transaccion, fn);
  }
}
