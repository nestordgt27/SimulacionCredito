import { Injectable } from '@nestjs/common';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import type { Desembolso } from '../domain/desembolso';
import type { DesembolsoRepository } from '../domain/desembolso.repository';

@Injectable()
export class PrismaDesembolsoRepository implements DesembolsoRepository {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async crear(desembolso: Desembolso): Promise<void> {
    await this.contexto.cliente.desembolso.create({
      data: {
        creditoId: desembolso.creditoId,
        banco: desembolso.banco,
        numeroCuenta: desembolso.numeroCuenta,
        montoCentavos: desembolso.montoCentavos,
        desembolsadoPorId: desembolso.desembolsadoPorId,
        fechaDesembolso: desembolso.fecha,
      },
    });
  }
}
