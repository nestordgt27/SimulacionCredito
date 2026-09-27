import { Injectable } from '@nestjs/common';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import type { NumeroCreditoGenerator } from '../domain/numero-credito.generator';
import { formatearNumeroCredito } from '../domain/numero-credito';

// Contador por año en la tabla `secuencias`. El incremento es atómico (UPDATE ... SET valor = valor + 1)
// y, al correr dentro de la transacción de aprobación, un rollback también revierte el número.
@Injectable()
export class PrismaNumeroCreditoGenerator implements NumeroCreditoGenerator {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async generar(anio: number): Promise<string> {
    const { valor } = await this.contexto.cliente.secuencia.upsert({
      where: { clave: `CREDITO-${anio}` },
      create: { clave: `CREDITO-${anio}`, valor: 1 },
      update: { valor: { increment: 1 } },
    });
    return formatearNumeroCredito(anio, valor);
  }
}
